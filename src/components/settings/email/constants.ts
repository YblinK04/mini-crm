export const KNOWN_PORT_SECURE: Record<number, boolean> = {
  465: true,   // implicit TLS
  587: false,  // STARTTLS
  25: false,   // plain / STARTTLS
  2525: false, // как 587
};

export const QUERY_KEY = ['settings', 'email'] as const;