import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dispatchEmailByType } from "./email-dispatch.service";
import {
  plainNoticeFromAddress,
  preparePlainNotice,
  renderPlainNoticeHtml,
  type PreparedPlainNotice,
} from "./plain-notice";

describe("plain notice html", () => {
  it("escapes markup and quotes", () => {
    const html = renderPlainNoticeHtml(`<script>alert("x")</script> 'ok'`);
    assert.equal(html.includes("<script"), false);
    assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
    assert.match(html, /&#39;ok&#39;/);
  });

  it("escapes ampersands", () => {
    const html = renderPlainNoticeHtml("fish & chips");
    assert.match(html, /fish &amp; chips/);
    assert.equal(html.includes("fish & chips"), false);
  });

  it("keeps line breaks", () => {
    const html = renderPlainNoticeHtml("one\r\ntwo\nthree");
    assert.match(html, /one<br>\s*two<br>\s*three/);
  });

  it("linkifies http and https urls and leaves trailing punctuation outside", () => {
    const html = renderPlainNoticeHtml(
      "See https://example.com/a?b=1&c=2. and http://example.com/ok",
    );
    assert.match(
      html,
      /<a href="https:\/\/example\.com\/a\?b=1&amp;c=2" rel="noopener noreferrer">https:\/\/example\.com\/a\?b=1&amp;c=2<\/a>\./,
    );
    assert.match(
      html,
      /<a href="http:\/\/example\.com\/ok" rel="noopener noreferrer">http:\/\/example\.com\/ok<\/a>/,
    );
  });

  it("does not linkify non-http schemes or credential urls", () => {
    const javascriptUrl = renderPlainNoticeHtml("javascript:alert(1)");
    assert.equal(javascriptUrl.includes("href="), false);
    assert.match(javascriptUrl, /javascript:alert\(1\)/);

    const ftp = renderPlainNoticeHtml("ftp://example.com/file");
    assert.equal(ftp.includes("href="), false);

    const credentials = renderPlainNoticeHtml(
      "https://user:pass@example.com/path",
    );
    assert.equal(credentials.includes("href="), false);
    assert.match(credentials, /user:pass@example\.com\/path/);
  });

  it("uses a light navy UniZ Campus header", () => {
    const html = renderPlainNoticeHtml("hello");
    assert.match(html, /UniZ Campus/);
    assert.match(html, /#0B2A47/);
    assert.match(html, /#e6ebf5/);
  });
});

describe("plain notice validation", () => {
  it("accepts one recipient and the subject and text limits", () => {
    const notice = preparePlainNotice("  person@example.com ", {
      subject: `  ${"s".repeat(200)}`,
      text: "t".repeat(20000),
    });
    assert.equal(notice.to, "person@example.com");
    assert.equal(notice.subject.length, 200);
    assert.equal(notice.text.length, 20000);
    assert.match(notice.html, /UniZ Campus/);
  });

  it("rejects a subject over 200 characters, newlines, or an empty subject", () => {
    assert.throws(
      () =>
        preparePlainNotice("person@example.com", {
          subject: "s".repeat(201),
          text: "hello",
        }),
      /subject must be 1\.\.200/,
    );
    assert.throws(
      () =>
        preparePlainNotice("person@example.com", {
          subject: "hello\nthere",
          text: "hello",
        }),
      /subject must be 1\.\.200/,
    );
    assert.throws(
      () =>
        preparePlainNotice("person@example.com", {
          subject: "   ",
          text: "hello",
        }),
      /subject must be 1\.\.200/,
    );
  });

  it("rejects text over 20000 characters or blank text", () => {
    assert.throws(
      () =>
        preparePlainNotice("person@example.com", {
          subject: "Hello",
          text: "t".repeat(20001),
        }),
      /text must be 1\.\.20000/,
    );
    assert.throws(
      () =>
        preparePlainNotice("person@example.com", {
          subject: "Hello",
          text: " \n ",
        }),
      /text must be 1\.\.20000/,
    );
  });

  it("requires exactly one email recipient", () => {
    const bad = [
      "a@example.com,b@example.com",
      "a@example.com;b@example.com",
      "a@example.com b@example.com",
      ["a@example.com", "b@example.com"],
      "not-an-email",
      "",
      "Name <a@example.com>",
    ];
    for (const to of bad) {
      assert.throws(
        () => preparePlainNotice(to, { subject: "Hello", text: "Body" }),
        /exactly one email recipient/,
        `accepted ${JSON.stringify(to)}`,
      );
    }
  });

  it("builds the UniZ Campus from address from SES_FROM_EMAIL", () => {
    assert.equal(
      plainNoticeFromAddress("ops@rguktong.in"),
      '"UniZ Campus" <ops@rguktong.in>',
    );
    assert.equal(
      plainNoticeFromAddress('"Other" <ops@rguktong.in>'),
      '"UniZ Campus" <ops@rguktong.in>',
    );
    assert.equal(
      plainNoticeFromAddress(""),
      '"UniZ Campus" <no-reply@rguktong.in>',
    );
  });
});

describe("plain notice dispatch", () => {
  it("sends exactly one prepared notice", async () => {
    const sent: PreparedPlainNotice[] = [];
    const ok = await dispatchEmailByType(
      "plain_notice",
      "person@example.com",
      { subject: "Hello", text: "Line\n<b>bold</b>" },
      {
        sendPlainNotice: async (notice) => {
          sent.push(notice);
          return true;
        },
      },
    );
    assert.equal(ok, true);
    assert.equal(sent.length, 1);
    assert.equal(sent[0]?.to, "person@example.com");
    assert.equal(sent[0]?.text, "Line\n<b>bold</b>");
    assert.match(sent[0]?.html || "", /&lt;b&gt;bold&lt;\/b&gt;/);
    assert.match(sent[0]?.html || "", /<br>/);
  });

  it("does not send when more than one recipient is given", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        dispatchEmailByType(
          "plain_notice",
          "a@example.com,b@example.com",
          { subject: "Hello", text: "Body" },
          {
            sendPlainNotice: async () => {
              calls += 1;
              return true;
            },
          },
        ),
      /exactly one email recipient/,
    );
    assert.equal(calls, 0);
  });

  it("still rejects unknown email types", async () => {
    await assert.rejects(
      () => dispatchEmailByType("newsletter", "person@example.com", {}),
      /Invalid email type: newsletter/,
    );
  });
});
