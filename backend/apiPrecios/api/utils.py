from fastapi.responses import JSONResponse
from bs4 import BeautifulSoup as bs
import pandas as pd
import httpx
import re
import json


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


def extract_data(data: bs) -> dict:
    """Extrae datos de un juego desde el HTML parseado con BeautifulSoup."""

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
            value = value.text.replace("/", "").replace("\n", " ").replace("\t", " ").strip()

            if " " in value and label.lower() not in not_splitting:
                value = value.split()
            info[label] = value

    offers_list = []

    script = data.find("script", id="aks-offers-js-extra")
    if script and script.string:
        match = re.search(r"var gamePageTrans = (\{.*?\});", script.string, re.DOTALL)
        if match:
            try:
                data_json = json.loads(match.group(1))
            except ValueError:
                data_json = {}
            if isinstance(data_json, dict):
                merchants = data_json.get("merchants", {})
                regions = data_json.get("regions", {})
                editions = data_json.get("editions", {})
                for offer in data_json.get("prices", []):
                    merchant_id = str(offer.get("merchant"))
                    try:
                        price_value = float(offer.get("price", 0))
                    except (TypeError, ValueError):
                        price_value = float("inf")
                    offers_list.append({
                        "price_value": price_value,
                        "price": f"{offer.get('price', '')}€",
                        "merchant": merchants.get(merchant_id, {}).get("name", "Unknown"),
                        "region": regions.get(offer.get("region"), {}).get("region_name", "Unknown"),
                        "edition": editions.get(offer.get("edition"), {}).get("name", "Unknown"),
                        "link": f"https://www.allkeyshop.com/redirection/offer/eur/{offer.get('id')}?locale=en&merchant={merchant_id}",
                        "coupon": offer.get("voucher_code"),
                    })

    offers_list.sort(key=lambda x: x.get("price_value", float("inf")))
    offers = {idx: {k: v for k, v in offer.items() if k != "price_value"} for idx, offer in enumerate(offers_list)}

    return {"game": game, "information": info, "offers": offers}


###############################################################################
#######################################


async def quicksearch(query: str) -> str | None:
    """Devuelve la URL del primer resultado de búsqueda en AllKeyShop."""

    query = convert_roman_tokens(query)
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
        except httpx.HTTPError:
            return None
    if resp.status_code != 200:
        return None
    try:
        html = resp.json().get("results", "")
    except ValueError:
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
