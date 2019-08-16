const isEmail = email => {
  const regEx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return Boolean(email.match(regEx));
};
const isEmpty = string => {
  return !string.trim().length > 0;
};

exports.validateSignUpData = data => {
  let errors = {};
  if (!isEmail(data.email)) {
    errors.email = "Must be a valid email address";
  } else if (isEmpty(data.email)) {
    errors.email = "Must not be empty";
  }

  if (isEmpty(data.userName)) errors.userName = "Must not be empty";

  if (isEmpty(data.password)) errors.password = "Must not be empty";

  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Does not match";

  const valid = Object.keys(errors).length === 0;

  return { errors, valid };
};

exports.validateLoginData = data => {
  let errors = {};
  if (isEmpty(data.password)) errors.password = "Must not be empty";

  if (!isEmail(data.email)) {
    errors.email = "Must be a valid email address";
  } else if (isEmpty(data.email)) {
    errors.email = "Must not be empty";
  }

  const valid = Object.keys(errors).length === 0;
  return { errors, valid };
};

exports.reduceUsersDetails = data => {
  let details = {};
  details.bio = data.bio.trim();
  details.location = data.location.trim();
  if (!data.website.startsWith("http")) {
    details.site = "http://" + data.website.trim();
  } else {
    details.website = data.website.trim();
  }

  return details;
};
