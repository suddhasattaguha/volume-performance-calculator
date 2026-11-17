"""End-to-end test of the 2026-11-17 build: no defaults, gated verdicts, scope-aware bands,
builder rules (RDP, API facade), evidence register, print report."""
import sys, pathlib
from playwright.sync_api import sync_playwright

URL = (pathlib.Path(__file__).resolve().parent.parent / "app" / "index.html").as_uri()
errs = []

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1300, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(300)

    def open_card(k):
        pg.keyboard.press("Escape")
        pg.locator(f'.hit[data-k="{k}"]').first.dispatch_event("click"); pg.wait_for_timeout(120)
    def chip(id, v):
        pg.locator(f'#pop [data-chip="{id}"][data-v="{v}"]').click(); pg.wait_for_timeout(80)
    def typ(sel, v):
        pg.locator(sel).click(); pg.keyboard.press("Control+A"); pg.keyboard.type(str(v)); pg.wait_for_timeout(80)

    # nothing answered: no verdicts, a list of what is missing
    assert pg.locator(".pcard h3").count() == 0
    assert "Still open" in pg.locator("#platNote").inner_text()
    open_card("src")
    assert pg.locator("#pop .fld.need").count() >= 3, "unanswered questions are highlighted"
    assert pg.locator("#pop .chip.on").count() == 0, "no preselected answers"
    assert pg.locator("#n_countries").input_value() == "", "no default numbers"
    chip("who", "human"); typ("#n_countries", 10)
    typ('#pop [data-num="nL"]', 2); typ('#pop [data-num="nM"]', 5); typ('#pop [data-num="nS"]', 3)
    pg.locator('#pop [data-reg="EM"]').click(); pg.locator('#pop [data-reg="AM"]').click()
    chip("usersKnown", "yes"); typ("#n_users", 5000); chip("growth", "1")
    assert "Still to answer" not in pg.locator("#cardCalc").inner_text(), pg.locator("#cardCalc").inner_text()
    open_card("msg"); chip("sizeMode", "known"); chip("normBand", "0"); chip("bigBand", "1")
    open_card("inf"); chip("traffic", "cont"); chip("per", "day"); chip("globalKnown", "no"); chip("typSize", "S")
    note = pg.locator("#pop .note").all_inner_texts()
    scope = [t for t in note if "typical small country" in t]
    print("scope note:", scope[0][:170] if scope else note)
    assert scope, "bands scaled for one small country"
    chip("busyBand", "1"); chip("avgBand", "-1")
    assert pg.locator(".pcard h3").count() == 0, "still gated: mid, del, tgt open"
    open_card("mid"); chip("work", "w2")
    open_card("del"); chip("send", "one")
    open_card("tgt"); chip("absorb", "few"); chip("sla", "min")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(150)
    cards = pg.locator(".pcard h3").all_inner_texts()
    print("verdicts:", [c.replace("\n", " ") for c in cards])
    assert len(cards) == 5

    # D1: inline factors show their number; evidence links in Why
    pg.locator("#plats .whyBtn").nth(1).click(); pg.wait_for_timeout(120)
    inp = pg.locator("#plats .fxBody .inl input").first
    w = inp.evaluate("e=>e.clientWidth"); sw = inp.evaluate("e=>e.scrollWidth")
    print("inline box value", inp.input_value(), "width", w, "scroll", sw)
    assert inp.input_value() != "" and sw <= w + 1, "number fits in the box"
    why = pg.locator("#plats .fxBody").first.inner_text()
    assert "sources (evidence vs the value set here)" in why.lower(), why[:300]
    assert pg.locator("#plats .fxBody a.evL").count() >= 1

    # designer: Solace queue over RDP into Azure APIM, then Service Bus and a Logic App
    pg.locator("[data-md]").dispatch_event("click"); pg.wait_for_timeout(150)
    def plat(k): pg.locator("#mdPp").click(); pg.locator(f'[data-mdap="{k}"]').click(); pg.wait_for_timeout(80)
    def comp(box, cid, ok=True):
        pg.locator(f'[data-mdpc="{box}"]').click(); pg.wait_for_timeout(60)
        btn = pg.locator(f'[data-mdac="{cid}"]')
        if not ok:
            assert btn.is_disabled(), cid; print("blocked", cid, "->", btn.get_attribute("title")); pg.locator('[data-mdpc="-1"]').click(); return
        assert not btn.is_disabled(), (cid, btn.get_attribute("title")); btn.click(); pg.wait_for_timeout(100)
    for k in ["btp", "sol", "az"]: plat(k)
    comp(0, "btp_http"); comp(1, "sol_topic"); comp(1, "sol_queue")
    comp(2, "az_apim", ok=False)                       # pulled queue: no API yet
    pg.locator('[data-mk="mode"]').select_option("rdp"); pg.wait_for_timeout(120)
    comp(2, "az_apim"); comp(2, "az_sb"); comp(2, "az_la")
    md = pg.locator("#mdPane").inner_text()
    assert "Outbound step" not in md
    pg.locator('[data-mdt="2"]').click(); pg.wait_for_timeout(100)
    assert "RDP delivery (rate)" in pg.locator(".mdDetail").inner_text()
    print("tiles:", [t.replace("\n", " | ") for t in pg.locator(".mdTile").all_inner_texts()])

    # rules: BTP back-end API facade after an iFlow may end a chain
    r = pg.evaluate("""()=>{RAWI.mdPlats=[{p:'btp',comps:[mdNew('btp_apim',0),mdNew('btp_http',1),mdNew('btp_apim',2)]}];syncChain();
      const E=mdEval(calc(false));return {bad:E.bad,out:E.ho.some(x=>x.comp==='Outbound step'),
        after:mdRule('az_sb',I.chain[2],3), lalasb:mdRule('az_sb',{c:'az_la',s:{}},2)}}""")
    print("facade rule:", r); assert not any(r["bad"]) and not r["out"] and r["after"] and r["lalasb"] == ""

    # print report
    pg.evaluate("()=>{window.__printed=0;window.print=()=>{window.__printed++};}")
    pg.locator("#printBtn").click(); pg.wait_for_timeout(150)
    assert pg.evaluate("window.__printed") == 1
    apx = pg.locator("#printApx").inner_text()
    assert "Evidence register" in apx and "Summary" in apx
    pg.emulate_media(media="print"); pg.screenshot(path="/tmp/print.png", full_page=True); pg.emulate_media(media="screen")

    # settings and guide show the evidence
    pg.locator("#gear").click(); pg.wait_for_timeout(120)
    assert "differs from evidence" in pg.locator("#setBg").inner_text()
    pg.locator("#setClose").click()
    pg.locator("#guideBtn").click(); pg.locator('[data-ch="sources"]').click(); pg.wait_for_timeout(100)
    g = pg.locator("#gMain").inner_text()
    assert "Evidence register" in g and "to review" in g
    pg.locator("#gClose").click()
    b.close()

print("ERRORS:", errs or "none")
sys.exit(1 if errs else 0)
