import FollowUp from '../models/FollowUp.js';
import MessageTemplate from '../models/MessageTemplate.js';
import Entry from '../models/Entry.js';

import twilioService from './twilioService.js';

class FollowUpService {

  /* ==========================================================
     TEMPLATE VARIABLE REPLACER
  ========================================================== */

  processTemplate(template, entry) {
    let content = template || '';

    content = content.replaceAll(
      '{{clientName}}',
      entry.clientName || ''
    );

    content = content.replaceAll(
      '{{phone}}',
      entry.clientPhone || ''
    );

    content = content.replaceAll(
      '{{location}}',
      entry.location || ''
    );

    content = content.replaceAll(
      '{{clientAddress}}',
      entry.clientAddress || ''
    );

    content = content.replaceAll(
      '{{clientCity}}',
      entry.clientCity || ''
    );

    content = content.replaceAll(
      '{{enquiryType}}',
      entry.enquiryType || ''
    );

    return content;
  }

  /* ==========================================================
     BULK SEND
  ========================================================== */

  async sendBulkMessages({
    entryIds,
    templateId,
    customMessage,
    channel,
    userId,
    userRole,
    userLocation
  }) {

    const query = {
      _id: { $in: entryIds }
    };

    if (userRole !== 'admin') {
      query.location = userLocation;
    }

    const entries = await Entry.find(query);

    if (!entries.length) {
      throw new Error('No entries found');
    }

    let template = null;

    if (templateId) {
      template = await MessageTemplate.findById(
        templateId
      );

      if (!template) {
        throw new Error('Template not found');
      }
    }

    const results = {
      total: entries.length,
      sent: 0,
      failed: 0,
      records: []
    };

    for (const entry of entries) {

      try {

        const finalMessage =
          template
            ? this.processTemplate(
                template.content,
                entry
              )
            : this.processTemplate(
                customMessage,
                entry
              );

        let response;

        if (channel === 'whatsapp') {
          response =
            await twilioService.sendWhatsApp(
              entry.clientPhone,
              finalMessage
            );
        } else {
          response =
            await twilioService.sendSMS(
              entry.clientPhone,
              finalMessage
            );
        }

        const followUp =
          await FollowUp.create({
            entryId: entry._id,

            clientName:
              entry.clientName,

            phone:
              entry.clientPhone,

            location:
              entry.location,

            templateId:
              template?._id,

            templateName:
              template?.name,

            channel,

            message:
              finalMessage,

            status:
              response.success
                ? 'sent'
                : 'failed',

            messageId:
              response.sid || null,

            error:
              response.error || null,

            sentBy:
              userId,

            sentAt:
              new Date()
          });

        await Entry.findByIdAndUpdate(
          entry._id,
          {
            $inc: {
              followUpCount: 1
            },
            lastFollowUpAt: new Date()
          }
        );

        if (response.success) {
          results.sent++;
        } else {
          results.failed++;
        }

        results.records.push(
          followUp
        );

      } catch (error) {

        results.failed++;

        const failedRecord =
          await FollowUp.create({
            entryId: entry._id,

            clientName:
              entry.clientName,

            phone:
              entry.clientPhone,

            location:
              entry.location,

            templateId:
              template?._id,

            templateName:
              template?.name,

            channel,

            message:
              customMessage || '',

            status:
              'failed',

            error:
              error.message,

            sentBy:
              userId,

            sentAt:
              new Date()
          });

        results.records.push(
          failedRecord
        );
      }
    }

    return results;
  }

  /* ==========================================================
     HISTORY
  ========================================================== */

  async getFollowUpHistory({
    page = 1,
    limit = 20,
    status,
    channel,
    phone,
    location,
    startDate,
    endDate,
    sentBy,
    userRole,
    userLocation
  }) {

    const query = {};

    if (
      userRole !== 'admin'
    ) {
      query.location =
        userLocation;
    }

    if (status) {
      query.status = status;
    }

    if (channel) {
      query.channel = channel;
    }

    if (phone) {
      query.phone = {
        $regex: phone,
        $options: 'i'
      };
    }

    if (
      location &&
      userRole === 'admin'
    ) {
      query.location =
        location;
    }

    if (sentBy) {
      query.sentBy = sentBy;
    }

    if (
      startDate ||
      endDate
    ) {

      query.sentAt = {};

      if (startDate) {
        query.sentAt.$gte =
          new Date(startDate);
      }

      if (endDate) {
        query.sentAt.$lte =
          new Date(endDate);
      }
    }

    const skip =
      (parseInt(page) - 1) *
      parseInt(limit);

    const history =
      await FollowUp.find(query)
        .populate(
          'sentBy',
          'name email role'
        )
        .populate(
          'templateId',
          'name'
        )
        .sort({
          sentAt: -1
        })
        .skip(skip)
        .limit(parseInt(limit));

    const total =
      await FollowUp.countDocuments(
        query
      );

    return {
      history,
      total,
      currentPage:
        parseInt(page),
      totalPages:
        Math.ceil(
          total / limit
        )
    };
  }

  /* ==========================================================
     CLIENT HISTORY
  ========================================================== */

  async getClientHistory(
    entryId
  ) {

    return await FollowUp.find({
      entryId
    })
      .populate(
        'sentBy',
        'name email role'
      )
      .sort({
        sentAt: -1
      });
  }

  /* ==========================================================
     STATS
  ========================================================== */

  async getFollowUpStats({
    userRole,
    userLocation
  }) {

    const match = {};

    if (
      userRole !== 'admin'
    ) {
      match.location =
        userLocation;
    }

    const total =
      await FollowUp.countDocuments(
        match
      );

    const sent =
      await FollowUp.countDocuments({
        ...match,
        status: 'sent'
      });

    const failed =
      await FollowUp.countDocuments({
        ...match,
        status: 'failed'
      });

    const whatsapp =
      await FollowUp.countDocuments({
        ...match,
        channel:
          'whatsapp'
      });

    const sms =
      await FollowUp.countDocuments({
        ...match,
        channel:
          'sms'
      });

    return {
      total,
      sent,
      failed,
      whatsapp,
      sms
    };
  }

  /* ==========================================================
     RETRY FAILED MESSAGE
  ========================================================== */

  async retryFailedMessage(
    followUpId,
    userId
  ) {

    const record =
      await FollowUp.findById(
        followUpId
      );

    if (!record) {
      throw new Error(
        'Follow up record not found'
      );
    }

    let response;

    if (
      record.channel ===
      'whatsapp'
    ) {
      response =
        await twilioService.sendWhatsApp(
          record.phone,
          record.message
        );
    } else {
      response =
        await twilioService.sendSMS(
          record.phone,
          record.message
        );
    }

    const retry =
      await FollowUp.create({
        entryId:
          record.entryId,

        clientName:
          record.clientName,

        phone:
          record.phone,

        location:
          record.location,

        templateId:
          record.templateId,

        templateName:
          record.templateName,

        channel:
          record.channel,

        message:
          record.message,

        status:
          response.success
            ? 'sent'
            : 'failed',

        messageId:
          response.sid,

        error:
          response.error,

        sentBy:
          userId,

        sentAt:
          new Date()
      });

    return retry;
  }
}

export default new FollowUpService();