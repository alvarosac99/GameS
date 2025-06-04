from fastapi.responses import JSONResponse
from bs4 import BeautifulSoup as bs
import pandas as pd


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


################################################################################
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

    # Extraer todas las filas de oferta agrupadas
    offer_rows = data.find_all("div", class_="offers-table-row")
    offers = {}

    for idx, row in enumerate(offer_rows):
        price = row.find("a", class_="x-offer-buy-btn")
        price_text = price.get_text(strip=True) if price else "Unknown"
        link = price.get("href") if price else None

        merchant = row.find("span", class_="offers-merchant-name")
        merchant_text = merchant.get_text(strip=True) if merchant else "Unknown"

        region = row.find("div", class_="offers-edition-region")
        region_text = region.get_text(strip=True) if region else "Unknown"

        edition = row.find("a", class_="x-offer-edition-name")
        edition_text = edition.get_text(strip=True) if edition else "Unknown"

        coupon = row.find("span", class_="x-offer-coupon-code")
        coupon_code = coupon.get_text(strip=True) if coupon else None

        offers[idx] = {
            "price": price_text,
            "merchant": merchant_text,
            "region": region_text,
            "edition": edition_text,
            "link": link,
            "coupon": coupon_code,
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
