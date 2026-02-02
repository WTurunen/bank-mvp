export type AuthValidationResult = {
  valid: boolean;
  field: string;
  message: string;
};

export function validateEmail(email: string): AuthValidationResult {
  if (!email) {
    return { valid: false, field: "email", message: "Email is required" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, field: "email", message: "Invalid email format" };
  }
  return { valid: true, field: "email", message: "" };
}

export function validatePassword(password: string): AuthValidationResult {
  if (!password) {
    return { valid: false, field: "password", message: "Password is required" };
  }
  if (password.length < 8) {
    return {
      valid: false,
      field: "password",
      message: "Password must be at least 8 characters",
    };
  }
  return { valid: true, field: "password", message: "" };
}

export function validateName(name: string): AuthValidationResult {
  if (!name) {
    return { valid: false, field: "name", message: "Name is required" };
  }
  if (name.length < 2) {
    return {
      valid: false,
      field: "name",
      message: "Name must be at least 2 characters",
    };
  }
  return { valid: true, field: "name", message: "" };
}
