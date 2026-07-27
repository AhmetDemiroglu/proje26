// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminDashboard } from "../components/admin-dashboard";

describe("yönetim paneli", () => {
  it("Firebase yapılandırılmadan kişisel veri göstermeyen giriş kabuğunu açar", async () => {
    render(<AdminDashboard />);
    expect(await screen.findByText("Yönetim merkezi")).toBeTruthy();
    expect(
      screen.getByText(/Yalnızca izin verilen, doğrulanmış yönetici hesabı/),
    ).toBeTruthy();
    expect(screen.queryByText("Burs adayları")).toBeNull();
  });
});

