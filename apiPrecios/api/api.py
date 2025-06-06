from bs4 import BeautifulSoup as bs
from dotenv import dotenv_values
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from http import HTTPStatus
from pydantic import BaseModel
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from starlette.responses import RedirectResponse
import docs
import os
import httpx
from httpx import HTTPError
import utils
import uvicorn

CONFIG = dict(dotenv_values(".env") or dotenv_values(".env.example"))
if not CONFIG:
    CONFIG = {
        "backlog": os.getenv("backlog", 2048),
        "debug": os.getenv("debug", False),
        "host": os.getenv("host", "0.0.0.0"),
        "log_level": os.getenv("log_level", "trace"),
        "port": os.getenv("port", 8080),
        "reload": os.getenv("reload", True),
        "timeout_keep_alive": os.getenv("timeout_keep_alive", 5),
        "workers": os.getenv("workers", 4),
    }
SAVE = False
CONFIG = utils.check_config(CONFIG)
api = FastAPI()


def get_driver(options: Options) -> webdriver.Chrome:
    """Devuelve una instancia de Chrome usando el chromedriver y binario local en ./chrome114."""
    chrome_binary = os.path.abspath("chrome114/chrome")  # Ruta al navegador
    driver_binary = os.path.abspath("chrome114/chromedriver")  # Ruta al driver

    options.binary_location = chrome_binary
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    service = Service(executable_path=driver_binary)
    return webdriver.Chrome(service=service, options=options)


class Game(BaseModel):
    """Model for the Game Information."""

    game: str
    information: dict
    offers: dict


async def fetch_page(client: httpx.AsyncClient, url: str):
    """Realiza una solicitud GET y registra el resultado."""
    print(f"[fetch_page] URL: {url}")
    try:
        resp = await client.get(url, follow_redirects=True)
    except HTTPError as e:
        print("[fetch_page] Error:", e)
        return None
    print("[fetch_page] Status:", resp.status_code)
    return resp


@api.get("/", include_in_schema=False)
async def root():
    """Redirects to the documentation."""
    return RedirectResponse(url="/docs")


@api.get("/check-price", response_model=Game, responses=docs.check_price_responses)
async def check_price(game: str, platform: str = "pc") -> dict:
    """Checks the price for a game on an specified platform."""
    print("[check_price] Juego recibido:", game)
    print("[check_price] Plataforma recibida:", platform)

    platform_enum = {
        "pc": "cd-key",
        "ps5": "ps5",
        "ps4": "ps4",
        "ps3": "ps3",
        "xbox series x": "xbox-series",
        "xbox one": "xbox-one",
        "xbox 360": "xbox-360",
        "nintendo switch": "nintendo-switch",
        "nintendo wii u": "nintendo-wii-u",
        "nintendo 3ds": "nintendo-3ds",
    }
    platform = platform.lower()
    if platform not in platform_enum:
        return JSONResponse(
            status_code=400,
            content={
                "message": (
                    f"Platform '{platform}' is not supported. "
                    f"These platforms are supported: {list(platform_enum.keys())}"
                )
            },
        )

    sanitized_game = "-".join(utils.convert_roman_tokens(game).lower().split())
    print("[check_price] Juego saneado:", sanitized_game)
    url = (
        f"https://www.allkeyshop.com/blog/buy-{sanitized_game}-"
        f"{platform_enum[platform]}-compare-prices/"
    )
    print("[check_price] URL construida:", url)

    async with httpx.AsyncClient() as client:
        print("[check_price] Solicitando página con httpx...")
        resp = await fetch_page(client, url)
        if resp is None:
            return JSONResponse(
                status_code=503, content={"message": "Service unavailable"}
            )
        print("[check_price] Código de estado recibido:", resp.status_code)
        if resp.status_code != 200:
            search_url = await utils.quicksearch(game)
            print("[check_price] URL alternativa:", search_url)
            if not search_url:
                status_code = resp.status_code
                detail = HTTPStatus(status_code).phrase
                print("[check_price] Error al obtener la página:", detail)
                return JSONResponse(
                    status_code=status_code, content={"message": detail}
                )
            url = search_url
            resp = await fetch_page(client, url)
            if resp is None or resp.status_code != 200:
                status_code = resp.status_code if resp else 503
                detail = (
                    HTTPStatus(status_code).phrase if resp else "Service Unavailable"
                )
                print("[check_price] Error al obtener la página tras búsqueda:", detail)
                return JSONResponse(
                    status_code=status_code, content={"message": detail}
                )

<<<<<<< ours
    soup = bs(resp.text, "html.parser")
=======
    options = Options()
    options.headless = True
    with get_driver(options) as driver:
        driver.get(url)
        cookies = {c["name"]: c["value"] for c in driver.get_cookies()}
        soup = bs(driver.page_source)
>>>>>>> theirs

    csv = utils.extract_data(soup, cookies=cookies)
    if isinstance(csv, JSONResponse):
        search_url = await utils.quicksearch(game)
        print("[check_price] Segunda URL alternativa:", search_url)
        if search_url and search_url != url:
<<<<<<< ours
            async with httpx.AsyncClient() as client:
                alt_resp = await fetch_page(client, search_url)
            if alt_resp is None or alt_resp.status_code != 200:
                return csv
            soup = bs(alt_resp.text, "html.parser")
            csv = utils.extract_data(soup)
=======
            options = Options()
            options.headless = True
            with get_driver(options) as driver:
                driver.get(search_url)
                cookies = {c["name"]: c["value"] for c in driver.get_cookies()}
                soup = bs(driver.page_source)
            csv = utils.extract_data(soup, cookies=cookies)
>>>>>>> theirs
        if isinstance(csv, JSONResponse):
            return csv

    if SAVE:
        utils.save(csv.get("Word", "any"), csv)
    csv["url"] = url
    return JSONResponse(status_code=HTTPStatus.OK, content=csv)


@api.get("/buscar-ofertas", responses=docs.buscar_ofertas_responses)
async def buscar_ofertas(game: str) -> dict:
    """Obtiene ofertas para todas las plataformas disponibles."""

    sanitized_game = "-".join(utils.convert_roman_tokens(game).lower().split())
    print("[buscar_ofertas] Juego saneado:", sanitized_game)
    url = f"https://www.allkeyshop.com/blog/buy-{sanitized_game}-cd-key-compare-prices/"
    print("[buscar_ofertas] URL construida:", url)

    async with httpx.AsyncClient() as client:
        resp = await fetch_page(client, url)
        if resp is None:
            return JSONResponse(
                status_code=503, content={"message": "Service unavailable"}
            )
        if resp.status_code != 200:
            search_url = await utils.quicksearch(game)
            print("[buscar_ofertas] URL alternativa:", search_url)
            if not search_url:
                status_code = resp.status_code
                detail = HTTPStatus(status_code).phrase
                return JSONResponse(
                    status_code=status_code, content={"message": detail}
                )
            url = search_url
            resp = await fetch_page(client, url)
            if resp is None or resp.status_code != 200:
                status_code = resp.status_code if resp else 503
                detail = (
                    HTTPStatus(status_code).phrase if resp else "Service Unavailable"
                )
                return JSONResponse(
                    status_code=status_code, content={"message": detail}
                )

    options = Options()
    options.headless = True
    with get_driver(options) as driver:
        driver.get(url)
        soup = bs(driver.page_source, "html.parser")
        platform_links: list[tuple[str, str]] = []
        for tab in soup.select("li.tab.platforms-link"):
            anchor = tab.find("a", href=True)
            meta = tab.find("meta", attrs={"data-itemprop": "platform"})
            name = (
                meta.get("content") if meta else (anchor.text if anchor else tab.text)
            )
            name = name.strip().lower()
            link = anchor["href"] if anchor else driver.current_url
            platform_links.append((name, link))

        result_offers: dict[str, dict] = {}
        info: dict | None = None
        game_name = game

        for plat, link in platform_links:
            print(f"[buscar_ofertas] Procesando {plat}: {link}")
            driver.get(link)
            cookies = {c["name"]: c["value"] for c in driver.get_cookies()}
            page_soup = bs(driver.page_source, "html.parser")
            data = utils.extract_data(page_soup, cookies=cookies)
            if isinstance(data, JSONResponse):
                continue
            if info is None:
                info = data.get("information", {})
                game_name = data.get("game", game)
            print(f"[buscar_ofertas] {plat} ofertas: {len(data.get('offers', {}))}")
            result_offers[plat] = {"url": link, "offers": data.get("offers", {})}

    if not result_offers:
        return JSONResponse(status_code=404, content={"message": "Game not found"})

    return JSONResponse(
        status_code=HTTPStatus.OK,
        content={
            "game": game_name,
            "information": info or {},
            "grouped_offers": result_offers,
        },
    )


def start() -> None:
    """Starts the Uvicorn server with the provided configuration."""
    uviconfig = {
        "app": "api:api",
        "interface": "asgi3",
        "host": CONFIG["host"],
        "port": CONFIG["port"],
        "log_level": CONFIG["log_level"],
        "reload": CONFIG["reload"],
        "workers": CONFIG["workers"],
        "backlog": CONFIG["backlog"],
        "timeout_keep_alive": CONFIG["timeout_keep_alive"],
    }
    try:
        uvicorn.run(**uviconfig)
    except Exception as e:
        print("Unable to run server.", e)


if __name__ == "__main__":
    start()
