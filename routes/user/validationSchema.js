const yup = require("yup");

const userDeliveryAddressSchema = yup.object().shape({
  name: yup.string(),
  recipient: yup.string().required(),
  address: yup.string().required(),
  zone_code: yup.string().matches(/^\d+$/).required(),
  detail_address: yup.string(),
  phone_prefix: yup.string().matches(/^\d+$/).min(2),
  phone_start: yup.string().matches(/^\d+$/).required().min(3),
  phone_end: yup.string().matches(/^\d+$/).required().min(4),
  direct_message: yup.string(),
  is_default: yup.boolean(),
});

module.exports = { userDeliveryAddressSchema };
