const mongoCollections = require("../config/mongoCollections");
const jobs = mongoCollections.jobs;
const companies = mongoCollections.companies;
const { ObjectId } = require("mongodb");
const jobhelper = require("../helper/jobHelpers");
const helper = require("../helper");

const createJob = async (
  description,
  responsibilities,
  visaRequirements,
  minimumQualification,
  image
) => {
  description = await jobhelper.checkifproperdescription(description);
  responsibilities = await jobhelper.checkifproperresponsibilities(
    responsibilities
  );
  visaRequirements = await jobhelper.checkifpropervisarequirements(
    visaRequirements
  );
  minimumQualification = await jobhelper.checkifproperminimumqualification(
    minimumQualification
  );

  const jobsCollection = await jobs();

  let job = {
    description: description,
    responsibilities: responsibilities,
    visaRequirements: visaRequirements,
    minimumQualification: minimumQualification,
    applications: [], //array of application docs id
    image: image,
  };

  const insertInfo = await jobsCollection.insertOne(job);

  if (!insertInfo.acknowledged || !insertInfo.insertedId)
    throw { status: "400", error: "Could not add Job" };

  const newId = insertInfo.insertedId.toString();

  const job1 = await getJobById(newId);

  job1._id = job1._id.toString();

  return job1;
};

const getAllJobs = async () => {
  const jobsCollection = await jobs();
  const arr = await jobsCollection.find({}).toArray();
  if (arr === null) return [];
  for (i in arr) {
    arr[i]._id = arr[i]._id.toString();
  }
  return arr;
};

const getJobById = async (jobId) => {
  if (!jobId) throw { status: "400", error: "No job id exists" };
  if (typeof jobId !== "string")
    throw { status: "400", error: "Type of job id is not a string" };
  if (jobId.trim().length === 0)
    throw {
      status: "400",
      error: "Job id cannot be empty or all white spaces",
    };

  jobId = jobId.trim();
  if (!ObjectId.isValid(jobId))
    throw { status: "400", error: "Job id is not valid" };
  const jobsCollection = await jobs();

  const jobbyid = await jobsCollection.findOne({ _id: ObjectId(jobId) });
  if (jobbyid === null)
    throw { status: "404", error: "No job found with that id" };

  jobbyid._id = jobbyid._id.toString();

  return jobbyid;
};

const removeJob = async (jobId) => {
  if (!jobId) throw { status: "400", error: "No job id exists" };
  if (typeof jobId !== "string")
    throw { status: "400", error: "Type of job id is not a string" };
  if (jobId.trim().length === 0)
    throw {
      status: "400",
      error: "Job id cannot be empty or all white spaces",
    };

  jobId = jobId.trim();

  if (!ObjectId.isValid(jobId))
    throw { status: "400", error: "Job id is not valid" };

  const jobsCollection = await jobs();
  var deletename = await getJobById(jobId);
  if (!deletename || deletename === undefined) {
    throw { status: "400", error: `Could not delete  with id of ${jobId}` };
  }

  const deletedjob = await jobsCollection.deleteOne({ _id: ObjectId(jobId) });
  if (deletedjob.deletedCount === 0) {
    throw {
      status: "400",
      error: `Could not delete flight with id of ${jobId}`,
    };
  }
  return `${deletename.jobId} has been successfully deleted! `;
};

const updateJob = async (
  id,
  description,
  responsibilities,
  visaRequirements,
  minimumQualification,
) => {
  if (!id) throw { status: "400", error: "No job id exists" };
  if (typeof id !== "string")
    throw { status: "400", error: "Type of job id is not a string" };
  if (id.trim().length === 0)
    throw {
      status: "400",
      error: "Job id cannot be empty or all white spaces",
    };

  id = id.trim();
  if (!ObjectId.isValid(id))
    throw { status: "400", error: "Job id is not valid" };

  description = await jobhelper.checkifproperdescription(description);
  responsibilities = await jobhelper.checkifproperresponsibilities(
    responsibilities
  );
  visaRequirements = await jobhelper.checkifpropervisarequirements(
    visaRequirements
  );
  minimumQualification = await jobhelper.checkifproperminimumqualification(
    minimumQualification
  );

  const jobsCollection = await jobs();
  let job1 = await getJobById(id);

  let updatedjob = {
    description: description,
    responsibilities: responsibilities,
    visaRequirements: visaRequirements,
    minimumQualification: minimumQualification,
  };
  const updatedInfo = await jobsCollection.updateOne(
    { _id: ObjectId(id) },
    { $set: updatedjob }
  );
  //if (updatedInfo.modifiedCount === 0) {
  // throw 'could not update flight successfully';

  //}
  return await getJobById(id);
};

const addApplicationToJobs = async (jobId, applicationId) => {
  if (!jobId) throw { status: "400", error: "No job id exists" };
  if (typeof jobId !== "string")
    throw { status: "400", error: "Type of job id is not a string" };
  if (jobId.trim().length === 0)
    throw {
      status: "400",
      error: "Job id cannot be empty or all white spaces",
    };

  jobId = jobId.trim();
  if (!ObjectId.isValid(jobId))
    throw { status: "400", error: "Job id is not valid" };

  if (!applicationId)
    throw { status: "400", error: "No application id exists" };
  if (typeof applicationId !== "string")
    throw { status: "400", error: "Type of application id is not a string" };
  if (applicationId.trim().length === 0)
    throw {
      status: "400",
      error: "application id cannot be empty or all white spaces",
    };

  applicationId = applicationId.trim();
  if (!ObjectId.isValid(applicationId))
    throw { status: "400", error: "application id is not valid" };

  const jobsCollection = await jobs();

  const jobbyid = await jobsCollection.findOne({ _id: ObjectId(jobId) });
  if (jobbyid === null)
    throw { status: "400", error: "No job found with that id" };

  jobbyid._id = jobbyid._id.toString();

  updatedApplication = [];
  for (i = 0; i < jobbyid.applications.length; i++) {
    updatedApplication.push(jobbyid.applications[i]);
  }
  updatedApplication.push(applicationId);

  let updated = await jobsCollection.updateOne(
    { _id: ObjectId(jobId) },
    { $set: { applications: updatedApplication } }
  );
  // console.log(updateFlightClass);
  if (updated.modifiedCount === 0)
    throw "Cannot add application id to job collection";

  const jobbyidd = await jobsCollection.findOne({ _id: ObjectId(jobId) });
  return jobbyidd;
};

const createJobByCompanyEmail = async (companyEmail, data) => {
  companyEmail = helper.common.isValidEmail(companyEmail);
  data = helper.job.isValidJobData(data);
  const companyCollection = await companies();
  let company = await companyCollection.findOne({
    email: companyEmail,
  });
  if (!company) {
    throw {
      status: "401",
      error: `Company doesn't have profile created to post a job`,
    };
  }
  const jobsCollection = await jobs();

  let job = {
    companyEmail: company.email,
    companyName: company.name,
    name: data.name,
    description: data.description,
    responsibilities: data.responsibilities,
    visaRequirements: data.visaRequirements,
    minimumQualification: data.minimumQualification,
    applications: [], //array of application docs id,
    image: data.image,
  };

  const insertInfo = await jobsCollection.insertOne(job);

  if (!insertInfo.acknowledged || !insertInfo.insertedId)
    throw { status: "500", error: "Could not add Job" };

  const newId = insertInfo.insertedId.toString();

  let a = company.jobs_posted;
  a.push(newId);
  let updatedCompany = {
    jobs_posted: a,
  };

  const updatedInfo = await companyCollection.updateOne(
    { email: companyEmail },
    { $set: updatedCompany }
  );
  if (updatedInfo.modifiedCount === 0) {
    throw {
      status: "400",
      error: "All new details exactly match the old details",
    };
  }
  const job1 = await getJobById(newId);

  job1._id = job1._id.toString();

  return job1;
};

const updateJobByCompanyEmail = async (jobId, companyEmail, data) => {
  jobId = helper.common.isValidId(jobId);
  companyEmail = helper.common.isValidEmail(companyEmail);
  data = helper.job.isValidJobData(data);
  const companyCollection = await companies();
  let company = await companyCollection.findOne({
    email: companyEmail,
  });
  if (!company) {
    throw {
      status: "401",
      error: `Company doesn't have profile created to post a job`,
    };
  }
  const jobsCollection = await jobs();
  let job = await getJobById(jobId);
  if (job.companyEmail !== companyEmail) {
    throw {
      status: "401",
      error: `Job isnt posting by the company to modify it`,
    };
  }

  let updatedJob = {
    companyEmail: job.companyEmail,
    companyName: data.companyName || job.companyName,
    name: data.name || job.name,
    description: data.description || job.description,
    responsibilities: data.responsibilities || job.responsibilities,
    visaRequirements: data.visaRequirements || job.visaRequirements,
    minimumQualification: data.minimumQualification || job.minimumQualification,
    applications: job.applications, //array of application docs id
    image: data.image || job.image,
  };

  const updatedInfo = await jobsCollection.updateOne(
    { _id: new ObjectId(jobId) },
    { $set: updatedJob }
  );
  if (updatedInfo.modifiedCount === 0) {
    throw {
      status: "400",
      error: "All new details exactly match the old details",
    };
  }
  const job1 = await getJobById(jobId);

  job1._id = job1._id.toString();

  return job1;
};

const deleteJobByCompanyEmail = async (jobId, companyEmail) => {
  jobId = helper.common.isValidId(jobId);
  companyEmail = helper.common.isValidEmail(companyEmail);
  const companyCollection = await companies();
  let company = await companyCollection.findOne({
    email: companyEmail,
  });
  if (!company) {
    throw {
      status: "401",
      error: `Company doesn't have profile created to post a job`,
    };
  }
  const jobsCollection = await jobs();
  let job = await getJobById(jobId);
  if (job.companyEmail !== companyEmail) {
    throw {
      status: "401",
      error: `Job isnt posting by the company to modify it`,
    };
  }

  const updatedInfo = await jobsCollection.deleteOne({
    _id: new ObjectId(jobId),
  });
  if (updatedInfo.modifiedCount === 0) {
    throw {
      status: "500",
      error: "Could not delete job posting",
    };
  }

  let a = company.jobs_posted;
  a = a.filter((value) => value !== jobId);
  let updatedCompany = {
    jobs_posted: a,
  };

  const updatedInfo2 = await companyCollection.updateOne(
    { email: companyEmail },
    { $set: updatedCompany }
  );
  if (updatedInfo2.modifiedCount === 0) {
    throw {
      status: "500",
      error: "Internal Server Error",
    };
  }

  return { deleted: true };
};

const getAllJobsByCompanyEmail = async (companyEmail) => {
  const jobsCollection = await jobs();
  const arr = await jobsCollection
    .find({ companyEmail: companyEmail })
    .toArray();
  if (arr === null) return [];
  for (i in arr) {
    arr[i]._id = arr[i]._id.toString();
  }
  return arr;
};

module.exports = {
  getAllJobs,
  createJob,
  removeJob,
  updateJob,
  getJobById,
  addApplicationToJobs,
  createJobByCompanyEmail,
  updateJobByCompanyEmail,
  deleteJobByCompanyEmail,
  getAllJobsByCompanyEmail,
};
