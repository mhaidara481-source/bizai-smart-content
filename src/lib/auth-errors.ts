export function getAuthErrorMessage(error: any): string {
  if (!error) return "Une erreur est survenue.";
  
  const message = error.message || "";
  const status = error.status;

  if (message.includes("Invalid login credentials") || message.includes("Email not confirmed")) {
    return "Email ou mot de passe incorrect.";
  }
  
  if (message.includes("User already registered")) {
    return "Un compte existe déjà avec cet email.";
  }

  if (message.includes("Password should be at least 6 characters")) {
    return "Le mot de passe doit faire au moins 6 caractères.";
  }

  if (status === 429 || message.includes("rate limit")) {
    return "Trop de tentatives. Veuillez patienter quelques minutes.";
  }

  return message || "Une erreur inattendue est survenue.";
}
