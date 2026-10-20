"""V2b workbench smoke test.

Run against a local dev server:

    pnpm dev --port 3100
    python docs/scripts/validation/verify_v2_workbench.py

The test injects the local mock session instead of depending on the optional
backend login endpoint. Set CS_IM_WEB_BASE_URL to point at another origin.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

BASE_URL = os.environ.get("CS_IM_WEB_BASE_URL", "http://localhost:3100").rstrip("/")
OUTPUT_DIR = Path(os.environ.get("CS_IM_WEB_SCREENSHOT_DIR", Path(tempfile.gettempdir()) / "cs-im-web-v2b"))

ROUTES = [
    ("/v2", "总览"),
    ("/v2/chat", "聊天室"),
    ("/v2/employee", "AI 客服员工"),
    ("/v2/knowledge", "知识库"),
    ("/v2/assign", "智能分配"),
    ("/v2/reminders", "基础提醒"),
    ("/chat", "聊天室"),
    ("/employee", "AI 客服员工"),
    ("/knowledge", "知识库"),
    ("/assign", "智能分配"),
    ("/reminders", "基础提醒"),
]

SESSION = {
    "userId": "demo",
    "displayName": "演示客服",
    "email": "demo@cs-im.local",
    "role": "客服专员",
    "workspace": "客服工作区",
    "createdAt": "2026-10-20T00:00:00.000Z",
    "token": "demo-token",
}


def inject_session(page: Page) -> None:
    page.goto(f"{BASE_URL}/login", wait_until="networkidle")
    page.evaluate(
        """(session) => {
            localStorage.setItem('cs-im-web.session', JSON.stringify(session));
        }""",
        SESSION,
    )


def check_routes(page: Page) -> None:
    for route, heading in ROUTES:
        page.goto(f"{BASE_URL}{route}", wait_until="networkidle")
        page.get_by_role("heading", name=heading).first.wait_for()
        name = route.strip("/").replace("/", "-") or "home"
        page.screenshot(path=str(OUTPUT_DIR / f"{name}.png"), full_page=True)


def check_chat(page: Page) -> None:
    page.goto(f"{BASE_URL}/v2/chat", wait_until="networkidle")

    page.get_by_role("radio", name="安抚").click()
    page.get_by_role("button", name="填充").first.click()
    draft = page.get_by_placeholder("输入中文回复，发送前自动翻译...")
    assert "退款" in draft.input_value()

    page.get_by_role("button", name="发送", exact=True).click()
    page.get_by_text("消息已发送给客户（中文 → Español）").wait_for()

    page.get_by_role("radio", name="内部备注").last.click()
    page.get_by_placeholder("记录内部备注，不会发送给客户...").fill("客户已等待一周，需在 30 分钟内回复。")
    page.get_by_role("button", name="保存备注").click()
    page.get_by_text("内部备注 · 不会发送给客户").wait_for()

    page.get_by_role("radio", name="回复客户").click()
    page.get_by_role("button", name="快捷回复").click()
    page.get_by_role("dialog").get_by_text("退款受理").click()
    assert "退款" in draft.input_value()

    page.get_by_role("button", name="知识库").click()
    page.get_by_role("dialog").get_by_role("button", name="填入回复").first.click()
    assert draft.input_value().strip()

    page.get_by_role("button", name="AI 生成").click()
    summary = page.get_by_label("会话摘要")
    assert "客户主要问题" in summary.input_value()

    page.get_by_role("button", name="转接").click()
    page.get_by_role("dialog").get_by_role("button", name="确认转接").click()
    page.get_by_text("会话已转接给").wait_for()


def check_employee(page: Page) -> None:
    page.goto(f"{BASE_URL}/v2/employee", wait_until="networkidle")
    page.get_by_role("button", name="创建 AI 客服员工").click()
    page.get_by_text("新 AI 客服员工").first.wait_for()
    page.get_by_role("tab", name="专业").click()
    page.get_by_text("知识库文档").wait_for()
    page.get_by_role("button", name="保存并发布").click()
    page.get_by_text("配置已保存并发布").wait_for()
    page.get_by_role("button", name="测试会话").click()
    page.get_by_role("button", name="运行测试").click()
    page.get_by_text("AI 将回复").wait_for()
    page.get_by_role("dialog").get_by_role("button", name="关闭").click()


def check_knowledge(page: Page) -> None:
    page.goto(f"{BASE_URL}/v2/knowledge", wait_until="networkidle")
    page.get_by_role("button", name="新增文档").click()
    page.get_by_role("heading", name="新增文档").wait_for()
    page.get_by_text("知识来源").wait_for()
    page.get_by_label("标题").fill("退款到账时间测试")
    page.get_by_label("答案 / 内容").fill("普通退款 1-2 个工作日，大额退款 3-5 个工作日。")
    page.get_by_role("button", name="保存").click()
    page.get_by_text("文档已保存").wait_for()


def check_assign_and_reminders(page: Page) -> None:
    page.goto(f"{BASE_URL}/v2/assign", wait_until="networkidle")
    page.get_by_role("button", name="编辑").first.click()
    page.get_by_role("heading", name="编辑分配规则").wait_for()
    page.get_by_role("dialog").get_by_role("button", name="取消").click()
    page.get_by_role("button", name="新增规则").click()
    page.get_by_text("已新增一条规则").wait_for()

    page.goto(f"{BASE_URL}/v2/reminders", wait_until="networkidle")
    page.get_by_role("radio", name="高").click()
    assert page.get_by_text("AI 连续 2 次回答失败").count() == 0
    page.get_by_role("radio", name="全部").click()
    page.get_by_role("button", name="完成", exact=True).first.click()
    page.get_by_role("button", name="恢复").first.wait_for()


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)

        inject_session(page)
        check_routes(page)
        check_chat(page)
        check_employee(page)
        check_knowledge(page)
        check_assign_and_reminders(page)

        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        page.get_by_role("button", name="Toggle Sidebar").click()
        page.wait_for_timeout(250)

        browser.close()
        print(f"V2b workbench checks passed. Screenshots: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
