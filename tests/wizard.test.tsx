// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TercihceApp from "../components/tercihce-app";
import type { ProgramRecord } from "../lib/types";

const program: ProgramRecord = {
  code: 100000001,
  university: "Örnek Üniversitesi",
  universityType: "DEVLET",
  city: "Ankara",
  faculty: "Mühendislik Fakültesi",
  program: "Bilgisayar Mühendisliği",
  programGroup: "Bilgisayar Mühendisliği",
  degree: "LİSANS",
  duration: 4,
  scoreType: "SAY",
  language: "Türkçe",
  funding: "Ücretsiz",
  quota2026: 60,
  score2025: 410.2,
  rank2025: 45_000,
  score2024: 405,
  rank2024: 47_500,
  accreditation: null,
  rankRequirement: 300_000,
  conditionCodes: [],
};

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/data/programs/say.json")) {
        return new Response(JSON.stringify([program]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "not mocked" }), {
        status: 404,
      });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Tercihçe analiz akışı", () => {
  it("yerleştirme sonucundan öneri listesine ilerler", async () => {
    const user = userEvent.setup();
    render(<TercihceApp />);

    await user.type(
      screen.getByLabelText("SAY yerleştirme puanı"),
      "412,482",
    );
    await user.type(
      screen.getByLabelText("SAY yerleştirme başarı sırası"),
      "42680",
    );
    await user.click(
      screen.getByRole("button", { name: /Tercihlerini ekle/i }),
    );

    expect(
      screen.getByRole("heading", { name: /Senin için önemli olan ne/i }),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Analizi başlat/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: /seçeneklerini birlikte daraltalım/i,
        }),
      ).toBeTruthy();
    });
    expect(
      screen.getByRole("heading", { name: "Bilgisayar Mühendisliği" }),
    ).toBeTruthy();
  });

  it("kayıt onayı istemeden kimliksiz kayıt bilgilendirmesi gösterir", async () => {
    const user = userEvent.setup();
    render(<TercihceApp />);

    await user.type(screen.getByLabelText("SAY yerleştirme puanı"), "412,482");
    await user.type(
      screen.getByLabelText("SAY yerleştirme başarı sırası"),
      "42680",
    );
    await user.click(
      screen.getByRole("button", { name: /Tercihlerini ekle/i }),
    );

    expect(screen.getByText(/Analiz kimliksiz çalışır/i)).toBeTruthy();
    expect(
      screen.queryByRole("checkbox", { name: /araştırma için paylaş/i }),
    ).toBeNull();
  });

  it("geçersiz puanı bir sonraki adıma geçmeden açıklar", async () => {
    const user = userEvent.setup();
    render(<TercihceApp />);

    await user.type(screen.getByLabelText("SAY yerleştirme puanı"), "90");
    await user.type(
      screen.getByLabelText("SAY yerleştirme başarı sırası"),
      "42680",
    );
    await user.click(
      screen.getByRole("button", { name: /Tercihlerini ekle/i }),
    );

    expect(
      screen.getByText(/Sayısal yerleştirme puanını 100 ile 600 arasında gir/i),
    ).toBeTruthy();
  });
});
