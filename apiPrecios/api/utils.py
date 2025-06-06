from fastapi.responses import JSONResponse
from bs4 import BeautifulSoup as bs
from http import HTTPStatus
import pandas as pd
import httpx
import re


ROMAN_PATTERN = re.compile(
    r"^(?=[MDCLXVI])M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$",
    re.IGNORECASE,
)


def is_roman_numeral(token: str) -> bool:
    """Devuelve ``True`` si el *token* es un número romano válido."""

    return bool(ROMAN_PATTERN.fullmatch(token))


def roman_to_int(token: str) -> int:
    """Convierte un número romano en su valor entero."""

    values = {
        "M": 1000,
        "CM": 900,
        "D": 500,
        "CD": 400,
        "C": 100,
        "XC": 90,
        "L": 50,
        "XL": 40,
        "X": 10,
        "IX": 9,
        "V": 5,
        "IV": 4,
        "I": 1,
    }

    i = 0
    result = 0
    token = token.upper()
    while i < len(token):
        if i + 1 < len(token) and token[i : i + 2] in values:
            result += values[token[i : i + 2]]
            i += 2
        else:
            result += values[token[i]]
            i += 1
    return result


def convert_roman_tokens(text: str) -> str:
    """Reemplaza tokens que sean números romanos por enteros."""

    tokens = text.split()
    converted = []
    for token in tokens:
        if is_roman_numeral(token):
            converted.append(str(roman_to_int(token)))
        else:
            converted.append(token)
    return " ".join(converted)


def check_config(CONFIG: dict) -> dict:
    """Valida el archivo de configuración. Devuelve el diccionario ya parseado."""
    fields = {
        "backlog": int,
        "debug": bool,
        "host": str,
        "log_level": str,
        "port": int,
        "reload": bool,
        "timeout_keep_alive": int,
        "workers": int,
    }

    for field in fields:
        if field not in CONFIG:
            raise ValueError(f"{field} is missing in config file.")

    config = {}
    for field_name, field_type in fields.items():
        try:
            config[field_name] = field_type(CONFIG[field_name])
        except ValueError as e:
            raise ValueError(f"{field_name} is not a valid {field_type}") from e
    return config


###############################################################################
#######################################


def extract_data(data: bs, cookies: dict | None = None) -> dict:
    """Extrae datos de un juego desde el HTML parseado con BeautifulSoup.

    Parameters
    ----------
    data: bs
        Documento parseado con BeautifulSoup.
    cookies: dict | None
        Cookies obtenidas durante la navegación con Selenium. Se envían en la
        petición para evitar bloqueos por parte de la web.
    """

    game_bs = data.find("span", {"data-itemprop": "name"})
    if game_bs is None:
        return JSONResponse(status_code=404, content={"message": "Game not found"})
    game = game_bs.text.replace("\n", "").replace("\t", "").strip()

    info = {}
    info_labels_bs = data.find_all("div", {"class": "game-info-table-label"})
    info_values_bs = data.find_all("div", {"class": "game-info-table-value"})
    if info_labels_bs and info_values_bs:
        not_splitting = ["release date", "developer", "publisher"]
        for label, value in zip(info_labels_bs, info_values_bs):
            label = label.text.replace("\n", " ").replace("\t", " ").strip()
            value = (
                value.text.replace("/", "")
                .replace("\n", " ")
                .replace("\t", " ")
                .strip()
            )

            if " " in value and label.lower() not in not_splitting:
                value = value.split()
            info[label] = value

    script = data.find("script", string=lambda t: t and "productId" in t)
    product_id = None
    if script and script.string:
        match = re.search(r"productId\s*=\s*(\d+)", script.string)
        if match:
            product_id = match.group(1)
    print("[extract_data] product_id:", product_id)

    offers = {}
    if product_id:
        params = {
            "action": "get_offers",
            "product": product_id,
            "currency": "eur",
            "region": "",
            "edition": "",
            "moreq": "",
            "locale": "en",
            "use_beta_offers_display": 1,
        }
        try:
            resp = httpx.get(
                "https://www.allkeyshop.com/blog/wp-admin/admin-ajax.php",
                params=params,
                follow_redirects=True,
                timeout=10,
                headers={"User-Agent": "Mozilla/5.0"},
                cookies=cookies,
            )
            print("[extract_data] Status ofertas:", resp.status_code)
            if resp.status_code == 200:
                try:
                    data_json = resp.json()
                    if not isinstance(data_json, dict):
                        raise ValueError("Invalid JSON")
                except ValueError:
                    print("[extract_data] Error al parsear JSON")
                    return JSONResponse(
                        status_code=500,
                        content={"message": "Error parsing offer data as JSON"},
                    )
            
                merchants = data_json.get("merchants", {})
                regions = data_json.get("regions", {})
                editions = data_json.get("editions", {})
                for idx, offer in enumerate(data_json.get("offers", [])):
                    price_info = offer.get("price", {}).get("eur", {})
                    merchant_id = str(offer.get("merchant"))
                    offers[idx] = {
                        "price": f"{price_info.get('price', '')}€",
                        "merchant": merchants.get(merchant_id, {}).get(
                            "name", "Unknown"
                        ),
                        "region": regions.get(offer.get("region"), {}).get(
                            "name", "Unknown"
                        ),
                        "edition": editions.get(offer.get("edition"), {}).get(
                            "name", "Unknown"
                        ),
                        "link": (
                            f"https://www.allkeyshop.com/redirection/offer/eur/{offer.get('id')}?locale=en&merchant={merchant_id}"
                        ),
                        "coupon": price_info.get("bestCoupon"),
                    }
        except httpx.HTTPError as e:
            print("[extract_data] Error de red:", e)
            else:
                return JSONResponse(
                    status_code=resp.status_code,
                    content={"message": HTTPStatus(resp.status_code).phrase},
                )
        except httpx.HTTPError:
            pass

    return {"game": game, "information": info, "offers": offers}


###############################################################################
#######################################


async def quicksearch(query: str) -> str | None:
    """Devuelve la URL del primer resultado de búsqueda en AllKeyShop."""

    query = convert_roman_tokens(query)
    print("[quicksearch] Consulta:", query)
    params = {
        "action": "quicksearch",
        "search_name": query,
        "currency": "eur",
        "locale": "en",
    }
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://www.allkeyshop.com/blog/wp-admin/admin-ajax.php",
                params=params,
                follow_redirects=True,
            )
        except httpx.HTTPError as e:
            print("[quicksearch] Error de red:", e)
            return None
    print("[quicksearch] Status:", resp.status_code)
    if resp.status_code != 200:
        return None
    try:
        html = resp.json().get("results", "")
    except ValueError:
        print("[quicksearch] Error al parsear JSON")
        return None
    soup = bs(html, "html.parser")
    first = soup.find("a", class_="ls-results-row-link")
    return first.get("href") if first else None


###############################################################################
#######################################


def save(word: str, data: dict) -> None:
    """Guarda las ofertas extraídas en un CSV."""
    pd.set_option("display.max_colwidth", 500)

    offers = data.get("offers", {})
    df = pd.DataFrame.from_dict(offers, orient="index")

    df.insert(0, "game", data.get("game", "unknown"))

    df.to_csv(f"{word}.csv", index=False, encoding="utf-8")
