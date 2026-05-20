import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { FeatureGateService } from './feature-gate.service';
import { UsageResetService } from './usage-reset.service';
import { InvoiceService } from './invoice.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, StripeService, FeatureGateService, UsageResetService, InvoiceService],
  exports: [BillingService, FeatureGateService, InvoiceService],
})
export class BillingModule {}
