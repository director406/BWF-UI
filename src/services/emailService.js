/**
 * EmailJS Admin Notification Service
 * Sends email notifications to director@beaconwingsfoundation.org on form submissions.
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_ooh3g8t";
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_g65ralc";
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "uIkXYWBHYKdmh_Nut";

const isConfigured = Boolean(PUBLIC_KEY);

if (!isConfigured) {
  console.warn(
    "[emailService] EmailJS is not configured — admin email notifications are disabled. Add VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY to enable them. The site itself is unaffected."
  );
}

export async function notifyAdminSubmission(type, data) {
  if (!isConfigured) return;

  const subjects = {
    volunteer: "New Volunteer Application",
    contact: "New Contact Message",
  };

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lib_version: "4.4.1",
        user_id: PUBLIC_KEY,
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        template_params: {
          to_email: "director@beaconwingsfoundation.org",
          subject: subjects[type] || "New Website Submission",
          submission_type: type,
          message: Object.entries(data)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n"),
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`EmailJS error (${response.status}): ${errText}`);
    }
  } catch (err) {
    console.error("[emailService] Failed to send admin notification:", err);
  }
}

