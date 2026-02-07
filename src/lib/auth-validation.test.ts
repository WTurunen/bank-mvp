import { describe, it, expect } from "vitest";
import { validateEmail, validatePassword, validateName } from "./auth-validation";

describe("validateEmail", () => {
  it("accepts valid email", () => {
    const result = validateEmail("user@example.com");
    expect(result.valid).toBe(true);
  });

  it("rejects empty email", () => {
    const result = validateEmail("");
    expect(result.valid).toBe(false);
    expect(result.field).toBe("email");
  });

  it("rejects invalid format", () => {
    const result = validateEmail("not-an-email");
    expect(result.valid).toBe(false);
  });

  it("rejects email without domain", () => {
    const result = validateEmail("user@");
    expect(result.valid).toBe(false);
  });

  it("rejects email without @", () => {
    const result = validateEmail("userexample.com");
    expect(result.valid).toBe(false);
  });

  it("accepts email with subdomain", () => {
    const result = validateEmail("user@mail.example.com");
    expect(result.valid).toBe(true);
  });

  it("accepts email with plus addressing", () => {
    const result = validateEmail("user+tag@example.com");
    expect(result.valid).toBe(true);
  });
});

describe("validatePassword", () => {
  it("accepts password with 8+ characters", () => {
    const result = validatePassword("password123");
    expect(result.valid).toBe(true);
  });

  it("rejects empty password", () => {
    const result = validatePassword("");
    expect(result.valid).toBe(false);
    expect(result.field).toBe("password");
  });

  it("rejects password shorter than 8 characters", () => {
    const result = validatePassword("short");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("8 characters");
  });

  it("accepts exactly 8 characters", () => {
    const result = validatePassword("12345678");
    expect(result.valid).toBe(true);
  });

  it("accepts long password", () => {
    const result = validatePassword("a".repeat(100));
    expect(result.valid).toBe(true);
  });

  it("rejects 7-character password", () => {
    const result = validatePassword("1234567");
    expect(result.valid).toBe(false);
  });
});

describe("validateName", () => {
  it("accepts valid name", () => {
    const result = validateName("John Doe");
    expect(result.valid).toBe(true);
  });

  it("rejects empty name", () => {
    const result = validateName("");
    expect(result.valid).toBe(false);
    expect(result.field).toBe("name");
  });

  it("rejects single character name", () => {
    const result = validateName("J");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("2 characters");
  });

  it("accepts exactly 2 characters", () => {
    const result = validateName("Jo");
    expect(result.valid).toBe(true);
  });

  it("accepts name with special characters", () => {
    const result = validateName("O'Brien-Smith");
    expect(result.valid).toBe(true);
  });
});
