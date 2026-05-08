import axios from 'axios';

class Msg91Service {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.senderId = process.env.MSG91_SENDER_ID;
    this.baseURL = 'https://api.msg91.com/api/v5';
    this.whatsappURL = 'https://api.msg91.com/api/v5/whatsapp';
    
    // Default template IDs (set these in .env)
    this.staffTemplateId = process.env.MSG91_STAFF_TEMPLATE_ID;
    this.customerTemplateId = process.env.MSG91_CUSTOMER_TEMPLATE_ID;
    this.smsTemplateId = process.env.MSG91_SMS_TEMPLATE_ID;
  }

  // Send WhatsApp message
  async sendWhatsApp(mobile, templateId = null, variables = {}) {
    try {
      // Format mobile number (add +91 if not present)
      const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;

      const payload = {
        sender: this.senderId,
        mobile: formattedMobile,
        template_id: templateId || this.staffTemplateId,
        variables: variables
      };

      console.log('📤 Sending WhatsApp:', { to: formattedMobile, template: payload.template_id });

      const response = await axios.post(`${this.whatsappURL}/send`, payload, {
        headers: {
          'authkey': this.authKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ WhatsApp sent:', response.data);
      
      return {
        success: true,
        messageId: response.data?.request_id || response.data?.messageId,
        response: response.data
      };

    } catch (error) {
      console.error('❌ WhatsApp error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        response: error.response?.data
      };
    }
  }

  // Send SMS
  async sendSMS(mobile, message, templateId = null) {
    try {
      // Format mobile for SMS (without +, with country code)
      const formattedMobile = mobile.startsWith('+') 
        ? mobile.substring(1) 
        : `91${mobile}`;

      const payload = {
        sender: this.senderId,
        mobiles: formattedMobile,
        template_id: templateId || this.smsTemplateId,
        message: message
      };

      console.log('📤 Sending SMS:', { to: formattedMobile });

      const response = await axios.post(`${this.baseURL}/flow/`, payload, {
        headers: {
          'authkey': this.authKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ SMS sent:', response.data);
      
      return {
        success: true,
        messageId: response.data?.request_id || response.data?.messageId,
        response: response.data
      };

    } catch (error) {
      console.error('❌ SMS error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        response: error.response?.data
      };
    }
  }

  // Send both WhatsApp and SMS
  async sendBoth(mobile, whatsappVars, smsMessage, options = {}) {
    const results = {
      whatsapp: null,
      sms: null
    };

    // Send WhatsApp
    if (options.sendWhatsapp !== false) {
      results.whatsapp = await this.sendWhatsApp(
        mobile,
        options.whatsappTemplateId,
        whatsappVars
      );
    }

    // Send SMS
    if (options.sendSms !== false) {
      results.sms = await this.sendSMS(
        mobile,
        smsMessage,
        options.smsTemplateId
      );
    }

    return results;
  }

  // Check delivery status
  async checkStatus(messageId, type = 'whatsapp') {
    try {
      const url = type === 'whatsapp' 
        ? `${this.whatsappURL}/status/${messageId}`
        : `${this.baseURL}/status/${messageId}`;

      const response = await axios.get(url, {
        headers: {
          'authkey': this.authKey
        }
      });

      return {
        success: true,
        status: response.data,
        response: response.data
      };

    } catch (error) {
      console.error('Status check error:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new Msg91Service();