const express = require("express");
const axios = require("axios");
const router = express.Router();
const xss = require("xss");
const data = require("../data");
const jobSeekerData = data.jobSeeker;
const mongoCollections = require("../config/mongoCollections");
const jobSeekers = mongoCollections.jobSeekers;
const helper = require("../helper");
const pdfCreateResume = require("../data/pdfCreateResume");
const resumes = require("../data/resumes");
const educationData = require("../data/education");
const experienceData = require("../data/experience");
const projectsData = require("../data/projects");
const common_helper = require("../helper/common");
const fs = require("fs");
var im = require("imagemagick");
const streamToBuffer = require("stream-to-buffer");
const { ObjectId } = require("mongodb");
const redis = require("redis");
const client = redis.createClient();
client.connect().then(() => {});

router
  .route("/dashboard")
  .get(async (req, res) => {
    try {
      let email = req.query.email;
      email = helper.common.isValidEmail(email);
      const profileExists = await jobSeekerData.profileExists(email);
      if (profileExists) {
        const data = await jobSeekerData.getJobSeekerByEmail(email);
        return res.json(data);
      } else {
        res.json({
          noProfileExists: true,
          message: "No profile is created for the user",
        });
      }
    } catch (e) {
      if (typeof e !== "object" || !("status" in e)) {
        return res.status(500).json("Internal server error");
      } else {
        return res.status(parseInt(e.status)).json(e.error);
      }
    }
  })
  .post(async (req, res) => {
    try {
      let data = req.body;
      for (let i in data) {
        if (Array.isArray(data[i])) {
          data[i] = data[i].map((item) => xss(item));
        } else {
          data[i] = xss(data[i]);
        }
      }
      let email = data.email;
      email = helper.common.isValidEmail(email);
      console.log(data);
      data = helper.jobseeker.isValidJobseekerData(data);
      const response = await axios.get(data.profile_picture, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(response.data, "utf-8");
      im.resize(
        {
          srcData: buffer,
          widht: 150,
          height: 150,
        },
        function (err, stdout, stderr) {
          if (err) return console.error(err.stack || err);
          fs.writeFileSync("image.jpg", stdout, "binary");
        }
      );
      const newJobSeeker = await jobSeekerData.createJobSeeker(data, email);
      return res.json(newJobSeeker);
    } catch (e) {
      console.log(e);
      if (typeof e !== "object" || !("status" in e)) {
        console.log(e);
        return res.status(500).json("Internal server error");
      } else {
        return res.status(parseInt(e.status)).json(e.error);
      }
    }
  })
  .patch(async (req, res) => {
    try {
      let data = req.body;
      for (let i in data) {
        if (Array.isArray(data[i])) {
          data[i] = data[i].map((item) => xss(item));
        } else {
          data[i] = xss(data[i]);
        }
      }
      let email = data.email;
      email = helper.common.isValidEmail(email);
      data = helper.jobseeker.isValidJobseekerData(data);
      if (data.profile_picture) {
        const response = await axios.get(data.profile_picture, {
          responseType: "arraybuffer",
        });
        const buffer = Buffer.from(response.data, "utf-8");
        im.resize(
          {
            srcData: buffer,
            widht: 150,
            height: 150,
          },
          function (err, stdout, stderr) {
            if (err) return console.error(err.stack || err);
            fs.writeFileSync("image.jpg", stdout, "binary");
          }
        );
      }

      const updatedJobSeeker = await jobSeekerData.updateJobSeekerByEmail(
        email,
        data
      );
      return res.json(updatedJobSeeker);
    } catch (e) {
      if (typeof e !== "object" || !("status" in e)) {
        console.log(e);
        return res.status(500).json("Internal server error");
      } else {
        return res.status(parseInt(e.status)).json(e.error);
      }
    }
  });

router
  .route("/singleJobSeeker/:id")
  .get(async (req, res) => {
    let id = req.params.id;
    try {
      id = helper.common.checkIsProperId(id);
      const data = await jobSeekerData.getJobSeekerByID(id);
      res.json(data);
    } catch (e) {
      if (typeof e !== "object" || !("status" in e)) {
        // console.log(e);
        return res.status(500).json("Internal server error");
      } else {
        return res.status(parseInt(e.status)).json(e.error);
      }
    }
  })
  .patch(async (req, res) => {
    try {
      let data = req.body;
      for (let i in data) {
        if (Array.isArray(data[i])) {
          data[i] = data[i].map((item) => xss(item));
        } else {
          data[i] = xss(data[i]);
        }
      }
      let id = req.params.id;
      id = helper.common.checkIsProperId(id);
      data = helper.jobseeker.isValidJobseekerData(data);
      const updatedJobSeeker = await jobSeekerData.updateJobSeeker(id, data);
      res.json(updatedJobSeeker);
      return;
    } catch (e) {
      if (typeof e !== "object" || !("status" in e)) {
        console.log(e);
        return res.status(500).json("Internal server error");
      } else {
        return res.status(parseInt(e.status)).json(e.error);
      }
    }
  });

router
  .route("/jobs") //GET all jobs
  .get(async (req, res) => {
    try {
      //console.log(req.query)
      const pageNumber = parseInt(req.query.page) || 1;
      const search = req.query.search || "";
      const visaReq = req.query.visaReq || "";
      const minQual = req.query.minQual || "";
      // console.log('0',pageNumber,"***");
      // console.log('1',search,"***");
      // console.log('2',visaReq,"***");
      // console.log('3',minQual,"***");
      const data = await jobSeekerData.getAllJobs(
        pageNumber,
        search,
        visaReq,
        minQual
      );
      res.json(data);
      return;
    } catch (e) {
      if (typeof e !== "object" || !("status" in e)) {
        console.log(e);
        res.status(500).json("Internal server error");
      } else {
        res.status(parseInt(e.status)).json(e.error);
      }
    }
  });

router.route("/HistoryOfApplications").get(async (req, res) => {
  try {
    let email = req.query.email;
    email = common_helper.isValidEmail(email);
    const data = await jobSeekerData.get_history_of_applications_by_email(
      email
    );
    if (data) {
      await client.set("jobSeekerApplications", JSON.stringify(data));
      await client.set("jobSeekerEmail", email);
    }
    res.json(data);
    return;
  } catch (e) {
    if (typeof e !== "object" || !("status" in e)) {
      console.log(e);
      res.status(500).json("Internal server error");
    } else {
      res.status(parseInt(e.status)).json(e.error);
    }
  }
});

router.get("/allJobSeekers", async (req, res) => {
  try {
    const data = await jobSeekerData.getAllJobSeekers();
    res.status(200).json(data);
    return;
  } catch (e) {
    if (typeof e !== "object" || !("status" in e)) {
      console.log(e);
      res.status(500).json("Internal server error");
    } else {
      res.status(parseInt(e.status)).json(e.error);
    }
  }
});

router.route("/create-resume").post(async (req, res) => {
  let resumeData = req.body;
  for (let i in resumeData) resumeData[i] = xss(resumeData[i]);
  let personalDetails = JSON.parse(resumeData.personalDetails);
  let education = JSON.parse(resumeData.education);
  let experience = JSON.parse(resumeData.experience);
  let projects = JSON.parse(resumeData.projects);
  let skills = JSON.parse(resumeData.skills);
  let userId;
  let createdResume;
  try {
    let email = personalDetails.email;
    email = helper.common.isValidEmail(email);
    const profileExists = await jobSeekerData.profileExists(email);
    // console.log(profileExists);
    if (profileExists) {
      const data = await jobSeekerData.getJobSeekerByEmail(email);
      // console.log(data);
      userId = data._id;
    } else {
      return res.json({
        noProfileExists: true,
        message: "No profile is created for the user",
        error: "No Profile is created for the user",
      });
    }
  } catch (e) {
    if (typeof e !== "object" || !("status" in e)) {
      return res.status(500).json({ error: "Internal server error" });
    } else {
      return res.status(parseInt(e.status)).json({ error: e.error });
    }
  }

  try {
    personalDetails.name = await helper.resumeHelper.checkifpropername(
      personalDetails.name
    );

    personalDetails.address = helper.resumeHelper.checkifproperaddress(
      personalDetails.address
    );

    personalDetails.linkedin = helper.resumeHelper.isValidLinkedIn(
      personalDetails.linkedin
    );
    // console.log("Route - " + personalDetails.email);
    personalDetails.email = helper.resumeHelper.isValidEmail(
      personalDetails.email
    );
    // console.log("here");
    personalDetails.contact = helper.resumeHelper.isValidContact(
      personalDetails.contact
    );

    for (let i = 0; i < skills.length; i++) {
      skills[i] = helper.resumeHelper.checkifproperskills(skills[i]);
    }
  } catch (e) {
    if (typeof e !== "object" || !("status" in e)) {
      console.log(e);
      return res.status(500).json({ error: "Internal server error" });
    } else {
      return res.status(parseInt(e.status)).json({ error: e.error });
    }
  }

  try {
    createdResume = await resumes.createResume(
      userId,
      personalDetails.name,
      personalDetails.address,
      personalDetails.linkedin,
      personalDetails.email,
      personalDetails.contact,
      skills
    );
    //  console.log(createdResume);
  } catch (e) {
    if (typeof e !== "object" || !("status" in e)) {
      console.log(e);
      return res.status(500).json({ error: "Internal server error" });
    } else {
      return res.status(parseInt(e.status)).json({ error: e.error });
    }
  }
  // console.log(education);
  try {
    for (let i = 0; i < education.length; i++) {
      education[i].school = helper.resumeHelper.checkifproperschool(
        education[i].school
      );
      education[i].address = helper.resumeHelper.checkifproperaddress(
        education[i].address
      );
      education[i].degree = helper.resumeHelper.checkifproperdegree(
        education[i].degree
      );
      education[i].gpa = helper.resumeHelper.isValidGpa(education[i].gpa);
      education[i].startYear = helper.resumeHelper.isValidYear(
        education[i].startYear
      );
      education[i].endYear = helper.resumeHelper.isValidYear(
        education[i].endYear
      );
      helper.resumeHelper.isValidStartEndYear(
        education[i].startYear,
        education[i].endYear
      );
      let createdEducation = await educationData.createEducation(
        createdResume._id,
        education[i].school,
        education[i].address,
        education[i].degree,
        education[i].gpa,
        education[i].startYear,
        education[i].endYear
      );
      //  console.log(createdEducation);
    }
  } catch (e) {
    if (typeof e !== "object" || !("status" in e)) {
      console.log(e);
      return res.status(500).json({ error: "Internal server error" });
    } else {
      return res.status(parseInt(e.status)).json({ error: e.error });
    }
  }

  try {
    for (let i = 0; i < experience.length; i++) {
      experience[i].company = helper.resumeHelper.checkifpropercompany(
        experience[i].company
      );
      experience[i].address = helper.resumeHelper.checkifproperaddress(
        experience[i].address
      );
      experience[i].position = helper.resumeHelper.checkifproperposition(
        experience[i].position
      );
      experience[i].startYear = helper.resumeHelper.isValidYear(
        experience[i].startYear
      );
      experience[i].endYear = helper.resumeHelper.isValidYear(
        experience[i].endYear
      );

      experience[i].startMonth = helper.resumeHelper.isValidMonth(
        experience[i].startMonth
      );
      experience[i].endMonth = helper.resumeHelper.isValidMonth(
        experience[i].endMonth
      );
      helper.resumeHelper.isValidStartEndYear(
        experience[i].startYear,
        experience[i].endYear,
        experience[i].startMonth,
        experience[i].endMonth
      );
      // experience[i].description = helper.common.isValidString(
      //   experience[i].description
      // );
      // console.log(experience, experience.bulletPoints);
      for (let j = 0; j < experience[i].bulletPoints.length; j++) {
        experience[i].bulletPoints[j] = helper.resumeHelper.checkifproperbullet(
          experience[i].bulletPoints[j]
        );
      }

      let createdExperience = await experienceData.createExperience(
        createdResume._id,
        experience[i].company,
        experience[i].address,
        experience[i].position,
        experience[i].bulletPoints,
        experience[i].startYear,
        experience[i].endYear,
        experience[i].startMonth,
        experience[i].endMonth
      );
      console.log(createdExperience);
    }
  } catch (e) {
    if (typeof e !== "object" || !("status" in e)) {
      console.log(e);
      return res.status(500).json({ error: "Internal server error" });
    } else {
      return res.status(parseInt(e.status)).json({ error: e.error });
    }
  }

  try {
    for (let i = 0; i < projects.length; i++) {
      projects[i].name = helper.resumeHelper.checkifproperprojectname(
        projects[i].name
      );
      projects[i].description =
        helper.resumeHelper.checkifproperprojectdescription(
          projects[i].description
        );

      let createdProject = await projectsData.createProject(
        createdResume._id,
        projects[i].name,
        projects[i].description
      );
      // console.log(createdProject);
    }
  } catch (e) {
    if (typeof e !== "object" || !("status" in e)) {
      console.log(e);
      return res.status(500).json({ error: "Internal server error" });
    } else {
      return res.status(parseInt(e.status)).json({ error: e.error });
    }
  }

  try {
    let email = personalDetails.email;
    console.log(email);
    let data;
    email = helper.common.isValidEmail(email);
    const profileExists = await jobSeekerData.profileExists(email);
    console.log(profileExists);
    if (profileExists) {
      data = await jobSeekerData.getJobSeekerByEmail(email);
      // console.log(data);
      userId = data._id;
    } else {
      return res.json({
        noProfileExists: true,
        message: "No profile is created for the user",
        error: "No Profile is created for the user",
      });
    }
    const jobSeekerCollection = await jobSeekers();
    const updatedJobSeeker = {
      name: data.name,
      email: email,
      address: data.address,
      education: data.education,
      field_of_employment: data.field_of_employment,
      profile_picture: data.profile_picture,
      skills: data.skills,
      years_of_experience: data.years_of_experience,
      resumeId: createdResume._id,
      jobs_applied: data.jobs_applied,
    };

    const updatedInfo = await jobSeekerCollection.updateOne(
      { _id: new ObjectId(data._id) },
      { $set: updatedJobSeeker }
    );
    if (updatedInfo.modifiedCount === 0) {
      throw {
        status: "400",
        error: "All new details exactly match the old details",
      };
    }
  } catch (e) {
    if (typeof e !== "object" || !("status" in e)) {
      console.log(e);
      return res.status(500).json({ error: "Internal server error" });
    } else {
      return res.status(parseInt(e.status)).json({ error: e.error });
    }
  }
  try {
    let pdf = await pdfCreateResume.createResumePdf(resumeData);

  streamToBuffer(pdf, (err, buffer) => {
    if (err) {
      // console.error("Error converting stream to buffer:", err);
      throw {status : 500 , error : "Error generating PDF file"};
    } else {
      res.set("Content-Type", "application/pdf");
      res.set("Content-Disposition", 'attachment; filename="resume.pdf"');
      return res.send(buffer);
    }
  });
  } catch (e) {
    if (typeof e !== "object" || !("status" in e)) {
      console.log(e);
      return res.status(500).json({ error: "Internal server error" });
    } else {
      return res.status(parseInt(e.status)).json({ error: e.error });
    }
  }
});

router.route("/resumeData/:id").get(async (req, res) => {
  let id = req.params.id;
  try {
    id = helper.common.checkIsProperId(id);
    const data = await resumes.getResumeById(id);
    return res.json(data);
  } catch (e) {
    if (typeof e !== "object" || !("status" in e)) {
      // console.log(e);
      return res.status(500).json({ error: "Internal server error" });
    } else {
      return res.status(parseInt(e.status)).json({ error: e.error });
    }
  }
});

module.exports = router;
