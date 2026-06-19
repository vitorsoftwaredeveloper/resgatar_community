const DISPOSABLE_DOMAINS = new Set([
  "mail.com", "mailinator.com", "guerrillamail.com", "guerrillamail.net",
  "guerrillamail.org", "guerrillamail.biz", "guerrillamail.de", "guerrillamail.info",
  "grr.la", "sharklasers.com", "spam4.me", "yopmail.com", "yopmail.fr",
  "cool.fr.nf", "jetable.fr.nf", "nospam.ze.tc", "nomail.xl.cx", "mega.zik.dj",
  "speed.1s.fr", "courriel.fr.nf", "moncourrier.fr.nf", "monemail.fr.nf",
  "monmail.fr.nf", "tempmail.com", "tempmail.net", "tempmail.org",
  "temp-mail.org", "temp-mail.io", "throwam.com", "throwam.net",
  "trashmail.com", "trashmail.net", "trashmail.me", "trashmail.at",
  "trashmail.io", "trashmail.xyz", "10minutemail.com", "10minutemail.net",
  "10minutemail.org", "fakeinbox.com", "mailnull.com", "maildrop.cc",
  "spamgourmet.com", "spamgourmet.net", "spamgourmet.org", "dispostable.com",
  "mailnesia.com", "spamhereplease.com", "spamthisplease.com",
  "example.com", "example.net", "example.org",
  "test.com", "test.net", "test.org", "teste.com", "teste.net", "localhost.com",
]);

export function validateEmailDomain(email: string): boolean {
  const parts = email.toLowerCase().trim().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (DISPOSABLE_DOMAINS.has(domain)) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/.test(domain)) return false;
  return true;
}

export function validateCPF(value: string): boolean {
  if (value.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(value)) return false;

  const calc = (factor: number) => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) {
      sum += parseInt(value[i]) * (factor - i);
    }
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };

  return calc(10) === parseInt(value[9]) && calc(11) === parseInt(value[10]);
}

export function validateCNPJ(value: string): boolean {
  if (value.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(value)) return false;

  const calc = (weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(value[i]) * weights[i];
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  return calc(w1) === parseInt(value[12]) && calc(w2) === parseInt(value[13]);
}

export function validateDocument(type: "CPF" | "CNPJ", numberType: string): boolean {
  return type === "CPF" ? validateCPF(numberType) : validateCNPJ(numberType);
}
