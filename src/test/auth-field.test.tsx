import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Field } from "@/components/site/AuthShell";
import { I18nProvider } from "@/lib/i18n";

function PasswordForm() {
  const [pw, setPw] = useState("Secret123");
  return (
    <I18nProvider>
      <form onSubmit={(e) => e.preventDefault()}>
        <Field label="Mot de passe" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
      </form>
    </I18nProvider>
  );
}

afterEach(cleanup);

describe("password field eye toggle", () => {
  it("reveals then hides the password without losing what was typed", () => {
    render(<PasswordForm />);
    const input = screen.getByLabelText("Mot de passe");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("value", "Secret123");

    fireEvent.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("value", "Secret123");

    fireEvent.click(screen.getByRole("button", { name: "Masquer le mot de passe" }));
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("value", "Secret123");
  });

  it("keeps typing while the password is shown", () => {
    render(<PasswordForm />);
    fireEvent.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    const input = screen.getByLabelText("Mot de passe");
    fireEvent.change(input, { target: { value: "Secret1234" } });
    expect(input).toHaveAttribute("value", "Secret1234");
    expect(input).toHaveAttribute("type", "text");
  });

  it("adds no toggle to ordinary fields", () => {
    render(
      <I18nProvider>
        <Field label="E-mail" type="email" value="a@b.com" onChange={() => {}} />
      </I18nProvider>,
    );
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("type", "email");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
