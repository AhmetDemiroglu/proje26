// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DonorApplicationForm } from "../components/donor-application-form";

describe("destekçi başvurusu", () => {
  it("eksik kişisel bilgiyi Firebase çağrısından önce reddeder", () => {
    const { container } = render(<DonorApplicationForm />);
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByText("Adını veya yetkili kişi adını gir.")).toBeTruthy();
  });

  it("kurumsal başvuruda kurum adı alanını gösterir", () => {
    render(<DonorApplicationForm />);
    fireEvent.click(screen.getByRole("button", { name: "Kurum veya şirket" }));
    expect(screen.getByText("Kurum veya şirket adı")).toBeTruthy();
  });
});
