import { getEmailGatewayStatus } from '../../utils/email-gateway'
import { getSmsGatewayStatus } from '../../utils/sms-gateway'

export default defineEventHandler(() => {
  return {
    email: getEmailGatewayStatus(),
    sms: getSmsGatewayStatus(),
  }
})
