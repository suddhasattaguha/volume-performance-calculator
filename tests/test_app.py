import sys, re
from playwright.sync_api import sync_playwright

import pathlib
URL = (pathlib.Path(__file__).resolve().parent.parent / "app" / "index.html").as_uri()
errs = []

def hit(page, k):
    page.locator(f'.hit[data-k="{k}"]').first.dispatch_event('click')
    page.wait_for_timeout(120)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1300, "height": 1000})
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    page.goto(URL)
    page.evaluate("localStorage.clear()"); page.reload()
    page.wait_for_timeout(300)

    # touch every part; set a busy volume by typing
    for k in ["src", "msg", "inf", "mid", "del", "tgt"]:
        hit(page, k)
        if k == "inf":
            page.locator("#n_busyExact").click()
            page.keyboard.type("20000")
            page.wait_for_timeout(150)
            print("inf card formula:", page.locator("#cardCalc .fLine").first.inner_text()[:160])
        if k == "msg":
            print("msg card values:", [t[:90] for t in page.locator("#cardCalc .estTop").all_inner_texts()])
            print("msg formula under normal:", page.locator("#cardCalc .fLine").first.inner_text()[:140])
        if k == "mid":
            print("mid:", page.locator("#cardCalc .fLine").first.inner_text())
        page.keyboard.press("Escape")

    cards = page.locator(".pcard h3").all_inner_texts()
    print("platform cards:", cards)
    assert len(cards) == 5
    txt = page.locator("#plats").inner_text()
    assert "Not suitable" in txt, "ADF should be Not suitable for continuous + minutes SLA"
    assert "ciCap" not in txt
    # Why view: calculation / boundaries split with inline factors
    page.locator('#plats .whyBtn').nth(3).click(); page.wait_for_timeout(150)
    why = page.locator("#plats .fxBody").first
    print("why:", why.inner_text()[:400].replace("\n", " | "))
    assert why.locator(".inl input").count() >= 1
    inl = why.locator('.inl input[data-ov="ciProcs"]')
    if inl.count():
        inl.click(); page.keyboard.press("Control+A"); page.keyboard.type("4"); page.keyboard.press("Enter")
        page.wait_for_timeout(200)
        assert page.locator("#runNote.on").count() == 1, "run override should show"
        print("after ciProcs=4:", page.locator("#plats .pcard").first.locator(".crow").nth(3).inner_text()[:160])

    # size display: 1,000 bytes and up as KB
    fmt = page.evaluate("[fmtB(1003),fmtB(999),fmtB(1024*1003),fmtB(5*1048576)]")
    print("fmtB:", fmt); assert fmt[0] == "1 KB" and fmt[1] == "999 B" and fmt[2].endswith("MB")

    # builder
    page.locator("#mdOpen").click(); page.wait_for_timeout(150)
    def add(plat, comp, expect_ok=True):
        page.locator("#mdAdd").click(); page.wait_for_timeout(80)
        page.locator(f'[data-mpp="{plat}"]').click(); page.wait_for_timeout(80)
        btn = page.locator(f'[data-mpc="{comp}"]')
        dis = btn.is_disabled()
        if not expect_ok:
            assert dis, f"{comp} should be blocked"
            print(f"blocked {comp}:", btn.get_attribute("title"))
            page.locator("#mdCancel").click(); page.wait_for_timeout(80); return
        assert not dis, f"{comp} should be allowed: {btn.get_attribute('title')}"
        btn.click(); page.wait_for_timeout(120)
    add("az", "az_sb", expect_ok=False)      # SB can't be inbound
    add("az", "az_apim")
    add("az", "az_sb", expect_ok=False)      # after API: iFlow or Logic App
    add("btp", "btp_http")
    add("sol", "sol_topic")
    add("sol", "sol_queue")
    add("btp", "btp_aem")
    md = page.locator("#md").inner_text()
    print("chain:", page.locator(".chain").inner_text().replace("\n", " "))
    for k in ["Size caps across hops", "Solace connections", "Bottleneck step", "End-to-end SLA", "Retries"]:
        assert k in md, k
    # change a step setting: parallel consumers 4
    inp = page.locator('[data-mk="procs"][data-mi="4"]')
    inp.click(); page.keyboard.press("Control+A"); page.keyboard.type("4"); page.keyboard.press("Tab")
    page.wait_for_timeout(200)
    print("queue step consumers:", page.locator(".mstep").nth(3).locator(".der").inner_text())
    print("chain verdict:", page.locator(".mdSum").inner_text())
    # retries on two layers -> Adapt
    page.locator('[data-mk="retry"][data-mi="3"]').check(); page.wait_for_timeout(150)
    page.locator('[data-mk="retry"][data-mi="4"]').check(); page.wait_for_timeout(150)
    rt = [t for t in page.locator("#md .crow").all_inner_texts() if "Retries" in t]
    print("retries:", rt[-1][:140].replace("\n", " ")); assert "Adapt" in rt[-1]
    # outbound rule: remove last step -> chain ends in a queue
    page.locator('[data-mrm="4"]').click(); page.wait_for_timeout(150)
    assert "Outbound step" in page.locator("#md").inner_text()
    print("after removing outbound:", page.locator(".mdSum").inner_text())
    add("btp", "btp_aem")
    # persistence
    page.reload(); page.wait_for_timeout(300)
    assert page.locator(".mstep").count() == 5, "chain should persist"
    # guide chapter + settings open
    page.locator("#guideBtn").click(); page.wait_for_timeout(150)
    page.locator('[data-ch="builder"]').click(); page.wait_for_timeout(100)
    assert "Positional rules" in page.locator("#gMain").inner_text()
    page.locator('[data-ch="review"]').click(); page.wait_for_timeout(100)
    print("review rows applied:", page.locator("#gMain").inner_text().count("Applied in v7"))
    page.locator("#gClose").click()
    page.locator("#gear").click(); page.wait_for_timeout(150)
    assert page.locator("#s_rho4").count() == 1 and page.locator("#s_ciNodes").count() == 1
    page.locator("#setClose").click()
    page.screenshot(path="/tmp/shot_full.png", full_page=True)
    page.locator("#mdBox").screenshot(path="/tmp/shot_builder.png")
    b.close()

print("ERRORS:", errs if errs else "none")
sys.exit(1 if errs else 0)
