const common = require("./common");

function checkFoe(string, variableName) {
  let foe = ["it", "automobile", "civil", "healthcare", "education", "law"];
  if (!foe.includes(string.toLowerCase())) {
    throw {
      status: 400,
      error: `${variableName} is not from the specified values`,
    };
  }
  return string;
}

const isValidCompanyData = (data) => {
  for (key in data) {
    switch (key) {
      case "name":
        data.name = common.isValidString(data.name, "Name");
        break;
      case "email":
        data.email = common.isValidEmail(data.email);
        break;
      case "type":
        data.type = common.isValidString(data.type, "Type of Company");
        data.type = checkFoe(data.type, "Type of Company");
        break;
      case "description":
        data.description = common.isValidString(
          data.description,
          "Description"
        );
        break;
      case "profile_picture":
        data.profile_picture = common.isValidWebImage(data.profile_picture);
        break;
      default:
        throw { status: "400", error: `Invalid key - ${key}` };
    }
  }
  return data;
};

module.exports = {
  isValidCompanyData,
};
