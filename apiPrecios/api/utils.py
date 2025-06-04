from fastapi.responses import JSONResponse
from bs4 import BeautifulSoup as bs
import pandas as pd


def check_config(config: dict) -> dict:
    """Valida el archivo de configuración y devuelve el diccionario parseado."""

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

    missing = [field for field in fields if field not in config]
    if missing:
        raise ValueError(f"Faltan campos en la configuración: {', '.join(missing)}")

    parsed = {}
    for field_name, field_type in fields.items():
        try:
            parsed[field_name] = field_type(config[field_name])
        except (ValueError, TypeError) as exc:
            raise ValueError(f"{field_name} no es un {field_type.__name__} válido") from exc
    return parsed


################################################################################
#######################################


def extract_data(data: bs) -> dict:
    """Extrae datos de un juego desde el HTML parseado con BeautifulSoup."""

    game_bs = data.find("span", {"data-itemprop": "name"})
    if game_bs is None:
        return JSONResponse(status_code=404, content={"message": "Game not found"})
    game = game_bs.text.replace("\n", "").replace("\t", "").strip()

    info = {}
    labels = data.find_all("div", class_="game-info-table-label")
    values = data.find_all("div", class_="game-info-table-value")
    if labels and values:
        no_split = {"release date", "developer", "publisher"}
        for label, value in zip(labels, values):
            label = label.get_text(" ", strip=True)
            value = value.get_text(" ", strip=True).replace("/", "")
            if " " in value and label.lower() not in no_split:
                value = value.split()
            info[label] = value

    # Extraer todas las filas de oferta agrupadas
    offer_rows = data.find_all("div", class_="offers-table-row")
    offers = {}

    def text_or_default(element, default="Unknown"):
        return element.get_text(strip=True) if element else default

    for idx, row in enumerate(offer_rows):
        price = row.find("a", class_="x-offer-buy-btn")
        merchant = row.find("span", class_="offers-merchant-name")
        region = row.find("div", class_="offers-edition-region")
        edition = row.find("a", class_="x-offer-edition-name")
        coupon = row.find("span", class_="x-offer-coupon-code")

        offers[idx] = {
            "price": text_or_default(price),
            "merchant": text_or_default(merchant),
            "region": text_or_default(region),
            "edition": text_or_default(edition),
            "link": price.get("href") if price else None,
            "coupon": coupon.get_text(strip=True) if coupon else None,
        }

    return {"game": game, "information": info, "offers": offers}


################################################################################
#######################################


def save(word: str, data: dict) -> None:
    """Guarda las ofertas extraídas en un CSV."""
    pd.set_option("display.max_colwidth", 500)

    offers = data.get("offers", {})
    df = pd.DataFrame.from_dict(offers, orient="index")

    df.insert(0, "game", data.get("game", "unknown"))

    df.to_csv(f"{word}.csv", index=False, encoding="utf-8")
