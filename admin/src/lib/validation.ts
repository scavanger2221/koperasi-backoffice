/**
 * Shared validation rules for Koperasi Backoffice forms.
 */

export type FieldErrors = Record<string, string>;

/** Validate a value and return error message (empty string = valid) */
export type Rule = (value: string, formValues?: Record<string, string>) => string;

export const rules = {
  required: (label = "Field ini"): Rule =>
    (v) => (!v || v.trim() === "" ? `${label} wajib diisi` : ""),

  minLength: (min: number, label = "Field ini"): Rule =>
    (v) => (v && v.trim().length < min ? `${label} minimal ${min} karakter` : ""),

  maxLength: (max: number, label = "Field ini"): Rule =>
    (v) => (v && v.trim().length > max ? `${label} maksimal ${max} karakter` : ""),

  pattern: (regex: RegExp, message: string): Rule =>
    (v) => (v && !regex.test(v.trim()) ? message : ""),

  /** NIK: exactly 16 digits */
  nik: (): Rule =>
    (v) => {
      if (!v) return "NIK wajib diisi";
      const cleaned = v.trim();
      if (!/^\d{16}$/.test(cleaned)) return "NIK harus 16 digit angka";
      return "";
    },

  /** Phone number: Indonesian format */
  phone: (label = "No Telepon"): Rule =>
    (v) => {
      if (!v) return `${label} wajib diisi`;
      const cleaned = v.trim().replace(/[- ]/g, "");
      if (!/^0\d{8,13}$/.test(cleaned)) return `${label} tidak valid (mulai dengan 0, 9-14 digit)`;
      return "";
    },

  /** Email format */
  email: (): Rule =>
    (v) => {
      if (!v) return "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Format email tidak valid";
      return "";
    },

  /** Minimum age (date of birth) */
  minAge: (min: number, label = "Tanggal Lahir"): Rule =>
    (v) => {
      if (!v) return `${label} wajib diisi`;
      const birth = new Date(v);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      if (age < min) return `Usia minimal ${min} tahun`;
      return "";
    },

  /** Positive number */
  positiveNumber: (label = "Jumlah"): Rule =>
    (v) => {
      if (!v) return `${label} wajib diisi`;
      const num = Number(v.replace(/[^0-9]/g, ""));
      if (isNaN(num) || num <= 0) return `${label} harus lebih dari 0`;
      return "";
    },

  /** Number range */
  range: (min: number, max: number, label = "Nilai"): Rule =>
    (v) => {
      if (!v) return `${label} wajib diisi`;
      const num = Number(v);
      if (isNaN(num)) return `${label} harus berupa angka`;
      if (num < min || num > max) return `${label} harus antara ${min} - ${max}`;
      return "";
    },

  /** Year (4 digits) */
  year: (label = "Tahun"): Rule =>
    (v) => {
      if (!v) return `${label} wajib diisi`;
      const cleaned = v.trim();
      if (!/^\d{4}$/.test(cleaned)) return `${label} tidak valid (format: YYYY)`;
      const y = parseInt(cleaned);
      if (y < 2020 || y > 2099) return `${label} harus antara 2020 - 2099`;
      return "";
    },
};

/**
 * Validate a set of fields against rules.
 * Returns { fieldKey: errorMessage } — empty object = valid.
 */
export function validate(
  fields: Record<string, string>,
  ruleMap: Record<string, Rule[]>
): FieldErrors {
  const errors: FieldErrors = {};
  for (const [key, fieldRules] of Object.entries(ruleMap)) {
    for (const rule of fieldRules) {
      const err = rule(fields[key] || "", fields);
      if (err) {
        errors[key] = err;
        break; // first error wins
      }
    }
  }
  return errors;
}
