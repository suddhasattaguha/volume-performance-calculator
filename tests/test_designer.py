import sys
from playwright.sync_api import sync_playwright
import pathlib
URL=(pathlib.Path(__file__).resolve().parent.parent/"app"/"index.html").as_uri();errs=[]
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={"width":1300,"height":1000})
    pg.on("pageerror",lambda e:errs.append(str(e)));pg.on("console",lambda m:errs.append(m.text) if m.type=="error" else None)
    pg.goto(URL);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(300)
    hit=lambda k:(pg.locator(f'.hit[data-k="{k}"]').first.dispatch_event('click'),pg.wait_for_timeout(100))
    for k in ["src","msg","inf","mid","del"]:
        hit(k)
        if k=="inf":
            pg.locator("#n_busyExact").click();pg.keyboard.type("20000");pg.wait_for_timeout(100)
        pg.keyboard.press("Escape")
    assert pg.locator("[data-md]").count()==0,"hint must wait for all inputs"
    hit("tgt");pg.keyboard.press("Escape");pg.wait_for_timeout(100)
    assert pg.locator("[data-md]").count()==1,"hint should show"
    svg_before=pg.locator("#svg").get_attribute("viewBox")
    pg.locator("[data-md]").dispatch_event("click");pg.wait_for_timeout(150)
    assert pg.locator("#mdPane").is_visible()
    pg.screenshot(path="/tmp/d0.png",clip={"x":0,"y":140,"width":1300,"height":700})
    def plat(k): pg.locator("#mdPp").click();pg.locator(f'[data-mdap="{k}"]').click();pg.wait_for_timeout(80)
    for k in ["btp","sol","btp"]: plat(k)
    def comp(box,cid,ok=True):
        pg.locator(f'[data-mdpc="{box}"]').click();pg.wait_for_timeout(60)
        btn=pg.locator(f'[data-mdac="{cid}"]')
        if not ok:
            assert btn.is_disabled(),cid;print("blocked",cid,"->",btn.get_attribute("title"));pg.locator('[data-mdpc="-1"]').click();return
        assert not btn.is_disabled(),btn.get_attribute("title");btn.click();pg.wait_for_timeout(100)
    comp(0,"btp_jms",ok=False)
    comp(0,"btp_http");comp(1,"sol_topic");comp(1,"sol_queue");comp(2,"btp_aem")
    print("tiles:",[t.replace("\n"," | ") for t in pg.locator(".mdTile").all_inner_texts()])
    print("foot:",pg.locator(".mdFoot").inner_text().replace("\n"," "))
    pg.locator('[data-mk="procs"]').click();pg.keyboard.press("Control+A");pg.keyboard.type("4");pg.keyboard.press("Tab");pg.wait_for_timeout(150)
    assert pg.locator("#svg").get_attribute("viewBox")==svg_before
    pg.locator("#mdPane").screenshot(path="/tmp/d1.png")
    pg.reload();pg.wait_for_timeout(300)
    assert pg.locator(".mdTile").count()==4,"persists"
    b.close()
print("ERRORS:",errs or "none");sys.exit(1 if errs else 0)
