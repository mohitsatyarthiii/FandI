import twilio from 'twilio';

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment variables');
  }

  return twilio(accountSid, authToken);
};

const normalizePhoneNumber = (mobile) => {
  if (!mobile) {
    throw new Error('Phone number is required');
  }

  const cleaned = mobile.toString().trim();
  const digits = cleaned.replace(/[^0-9+]/g, '');

  if (!digits) {
    throw new Error('Invalid phone number');
  }

  if (cleaned.startsWith('+')) {
    return `+${digits.replace(/^\+/, '')}`;
  }

  const normalized = digits.replace(/^0+/, '');

  if (normalized.length === 10) {
    return `+91${normalized}`;
  }

  if (normalized.length === 12 && normalized.startsWith('91')) {
    return `+${normalized}`;
  }

  return `+${normalized}`;
};

class TwilioService {
  async sendWhatsApp(mobile, body) {
    try {
        const client = getTwilioClient();
      const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
      if (!whatsappFrom) throw new Error('TWILIO_WHATSAPP_FROM must be set in environment variables');

      const to = `whatsapp:${normalizePhoneNumber(mobile)}`;
      const from = whatsappFrom?.startsWith('whatsapp:')
        ? whatsappFrom
        : `whatsapp:${whatsappFrom}`;

      const message = await client.messages.create({
        from,
        to,
        body
      });

      return {
        success: true,
        sid: message.sid,
        body: message.body,
        response: message
      };
    } catch (error) {
      console.error('Twilio WhatsApp error:', error.message || error);
      return {
        success: false,
        error: error.message || String(error)
      };
    }
  }

  async sendSMS(mobile, body) {
    try {
        const client = getTwilioClient();
      const smsFrom = process.env.TWILIO_SMS_FROM;
      if (!smsFrom) throw new Error('TWILIO_SMS_FROM must be set in environment variables');

      const to = normalizePhoneNumber(mobile);
      const from = smsFrom;

      const message = await client.messages.create({
        from,
        to,
        body
      });

      return {
        success: true,
        sid: message.sid,
        body: message.body,
        response: message
      };
    } catch (error) {
      console.error('Twilio SMS error:', error.message || error);
      return {
        success: false,
        error: error.message || String(error)
      };
    }
  }

  async sendBoth(mobile, whatsappBody, smsBody) {
    const results = {
      whatsapp: null,
      sms: null
    };

    if (whatsappBody) {
      results.whatsapp = await this.sendWhatsApp(mobile, whatsappBody);
    }

    if (smsBody) {
      results.sms = await this.sendSMS(mobile, smsBody);
    }

    return results;
  }
}

export default new TwilioService();
