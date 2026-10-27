import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { EmailService } from '../../src/email/email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: { get: jest.Mock<(...args: any[]) => any> };
  let sendMail: jest.Mock<(...args: any[]) => any>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          SMTP_HOST: 'mail.example.test',
          SMTP_PORT: '587',
          EMAIL_SECURE: 'false',
          SMTP_USER: faker.internet.email(),
          SMTP_PASS: faker.string.alphanumeric(20),
          EMAIL_FROM: faker.internet.email(),
        };

        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    sendMail = jest.fn<(...args: any[]) => any>();
    (service as any).transporter = { sendMail };
  });

  it('TC0001 - sends an email with configured sender and content', async () => {
    const info = { messageId: faker.string.uuid() };
    const recipient = faker.internet.email();
    const subject = faker.lorem.sentence();
    const html = `<p>${faker.lorem.sentence()}</p>`;
    sendMail.mockResolvedValue(info);

    await expect(service.sendMail(recipient, subject, html)).resolves.toBe(info);
    expect(sendMail).toHaveBeenCalledWith({
      from: expect.any(String),
      to: recipient,
      subject,
      html,
    });
  });

  it('TC0002 - propagates transport errors after logging failure', async () => {
    const error = new Error('SMTP unavailable');
    sendMail.mockRejectedValue(error);
    const loggerError = jest.spyOn((service as any).logger, 'error');
    loggerError.mockImplementation(() => {});

    await expect(
      service.sendMail(faker.internet.email(), 'subject', '<p>body</p>'),
    ).rejects.toBe(error);
    expect(loggerError).toHaveBeenCalledWith('Failed to send email', error);
  });

  it('TC0003 - uses the default SMTP port when configuration is invalid', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'SMTP_HOST') return 'mail.example.test';
      if (key === 'SMTP_PORT') return 'invalid-port';
      if (key === 'EMAIL_SECURE') return 'true';
      if (key === 'EMAIL_FROM') return faker.internet.email();
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();
    const defaultConfiguredService = module.get<EmailService>(EmailService);
    sendMail = jest.fn<(...args: any[]) => any>().mockResolvedValue({
      messageId: faker.string.uuid(),
    });
    (defaultConfiguredService as any).transporter = { sendMail };

    await defaultConfiguredService.sendMail(
      faker.internet.email(),
      faker.lorem.sentence(),
      '<p>message</p>',
    );

    expect(sendMail).toHaveBeenCalledTimes(1);
  });
});