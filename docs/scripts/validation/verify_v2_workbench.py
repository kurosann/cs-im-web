from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:3100"
OUTPUT_DIR = Path(r"C:\Users\lanyun\AppData\Local\Temp\cs-im-web-v2")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)

        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        page.locator("#identifier").fill("demo")
        page.locator("#password").fill("demo1234")
        page.locator("#privacy-consent").check()
        page.get_by_role("button", name="进入工作台").click()
        page.wait_for_url(f"{BASE_URL}/")

        routes = [
            ("/v2", "总览"),
            ("/v2/chat", "聊天室"),
            ("/v2/employee", "AI 客服员工"),
            ("/v2/knowledge", "知识库"),
            ("/v2/assign", "智能分配"),
            ("/v2/reminders", "基础提醒"),
            ("/chat", "聊天室"),
            ("/apps", "业务渠道"),
            ("/channels", "转发渠道"),
            ("/ai", "AI 客服"),
            ("/webhook", "Webhook"),
            ("/logs", "消息日志"),
            ("/settings", "设置"),
        ]

        for route, heading in routes:
            page.goto(f"{BASE_URL}{route}", wait_until="networkidle")
            page.get_by_role("heading", name=heading).first.wait_for()
            page.screenshot(path=str(OUTPUT_DIR / f"{route.strip('/').replace('/', '-') or 'home'}.png"), full_page=True)

        page.goto(f"{BASE_URL}/v2/chat", wait_until="networkidle")
        page.get_by_role("button", name="AI 辅助").click()
        page.get_by_role("button", name="快捷回复").click()
        page.get_by_role("button", name="快捷翻译").click()
        page.get_by_placeholder("输入回复...").fill("退款已受理")
        page.get_by_role("button", name="发送").click()
        page.get_by_text("消息已发送").wait_for()

        page.goto(f"{BASE_URL}/v2/knowledge", wait_until="networkidle")
        page.get_by_role("button", name="新增文档").click()
        page.get_by_role("heading", name="新增文档").wait_for()
        page.get_by_role("button", name="关闭").click()

        page.goto(f"{BASE_URL}/v2/reminders", wait_until="networkidle")
        page.get_by_role("button", name="完成").first.click()

        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        page.get_by_role("button", name="收起导航栏").click()
        page.get_by_role("button", name="展开导航栏").wait_for()

        browser.close()


if __name__ == "__main__":
    main()
