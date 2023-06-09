const express = require("express");
const router = express.Router();
const xss = require("xss");
const data = require("../data");
const companyData = data.company;
const jobseekerData = data.jobSeeker;
const jobData = data.jobs;
const helper = require("../helper");
const axios = require("axios");
var im = require("imagemagick");
const fs = require("fs");
const path = require("path");
const streamToBuffer = require("stream-to-buffer");
const pdfCreateResume = require("../data/pdfCreateResume");

router
  .route("/dashboard")
  .get(async (req, res) => {
    try {
      let email = req.query.email;
      email = helper.common.isValidEmail(email);
      const profileExists = await companyData.profileExists(email);
      if (profileExists) {
        const data = await companyData.getCompanyByEmail(email);
        return res.json(data);
      } else {
        res.json({
          noProfileExists: true,
          message: "No profile is created for the user",
        });
      }
    } catch (e) {
      if (typeof e !== "object" || !("status" in e)) {
        console.log(e);
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
      data = helper.company.isValidCompanyData(data);
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
      const newCompany = await companyData.createCompany(data, email);
      return res.json(newCompany);
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
      data = helper.company.isValidCompanyData(data);
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
      const updatedCompany = await companyData.updateCompanyByEmail(
        email,
        data
      );
      let allJobs = await jobData.getAllJobsByCompanyEmail(email);
      allJobs = await Promise.all(
        allJobs.map(async (job) => {
          if (
            job.companyEmail === email &&
            (data.profile_picture || data.name)
          ) {
            const updatedJob = await jobData.updateJobByCompanyEmail(
              job._id,
              email,
              { image: updatedCompany.image, companyName: updatedCompany.name }
            );
          }
        })
      );
      return res.json(updatedCompany);
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
  .route("/")
  .get(async (req, res) => {
    try {
      id = helper.common.isValidId(id);
      const data = await companyData.getCompanyDataById(id);
      res.json(data);
    } catch (e) {
      if (typeof e !== "object" || !("status" in e)) {
        console.log(e);
        res.status(500).json("Internal server error");
      } else {
        res.status(parseInt(e.status)).json(e.error);
      }
    }
  })
  .patch(async (req, res) => {
    let data = req.body;
    // console.log(data);
    try {
      for (let i in data) {
        if (typeof data[i] === "object") {
          for (let j in data[i])
            if (Array.isArray(data[i][j]))
              data[i][j] = data[i][j].map((element) => {
                return xss(element);
              });
            else data[i][j] = xss(data[i][j]);
        } else {
          data[i] = xss(data[i]);
        }
      }

      // let id = req.session.company._id;
      let id = "643485c32aa19be61c88787b"; //temp id. In the future it'll be taken from the session/token/redis whatever we decide.
      id = helper.common.isValidId(id);
      data = helper.company.isValidCompanyData(data);

      const updatedCompany = await companyData.updateCompany(id, data);
      res.json(updatedCompany);
    } catch (e) {
      if (typeof e !== "object" || !("status" in e)) {
        console.log(e);
        res.status(500).json("Internal server error");
      } else {
        res.status(parseInt(e.status)).json(e.error);
      }
    }
  });

router
  .route("/jobseeker/:jobseekerId")
  .get(async (req, res) => {
    try {
      // console.log("Here :  " + req.params.jobseekerId);
      const jobseekerId = helper.common.isValidId(req.params.jobseekerId);
      const jobseeker = await jobseekerData.getJobSeekerByID(jobseekerId);
      let resume;
      if (jobseeker.resumeId) {
        resume = await jobseekerData.getResumeByID(jobseeker.resumeId);
      }
      res.json(resume);
    } catch (e) {
      if (typeof e !== "object" || !("status" in e)) {
        console.log(e);
        res.status(500).json("Internal server error");
      } else {
        res.status(parseInt(e.status)).json(e.error);
      }
    }
  })
  .post(async (req, res) => {
    let resumeData = req.body;
    // console.log("before",resumeData);

    let education = JSON.parse(resumeData.education);
    let experience = JSON.parse(resumeData.experience);
    let projects = JSON.parse(resumeData.projects);
    let skills = JSON.parse(resumeData.skills);
    // console.log("after", resumeData);

    for (let i in resumeData) {
      if (Array.isArray(resumeData[i])) {
        resumeData[i] = resumeData[i].map((item) => xss(item));
      } else if (typeof resumeData[i] === "object") {
        for (let j in resumeData[i])
          if (Array.isArray(resumeData[i][j]))
            resumeData[i][j] = resumeData[i][j].map((element) => {
              return xss(element);
            });
          else resumeData[i][j] = xss(resumeData[i][j]);
      } else {
        resumeData[i] = xss(resumeData[i]);
      }
    }
    try {
      resumeData.name = helper.resumeHelper.checkifpropername(resumeData.name);
      resumeData.address = helper.resumeHelper.checkifproperaddress(
        resumeData.address
      );
      resumeData.linkedin = helper.resumeHelper.isValidLinkedIn(
        resumeData.linkedin
      );
      resumeData.email = helper.resumeHelper.isValidEmail(resumeData.email);
      resumeData.contact = helper.resumeHelper.isValidContact(
        resumeData.contact
      );
      console.log("here routes - ");
      for (let i = 0; i < resumeData.skills.length; i++) {
        resumeData.skills[i] = helper.resumeHelper.checkifproperskills(
          resumeData.skills[i]
        );
      }
    } catch (e) {
      if (typeof e !== "object" || !("status" in e)) {
        return res.status(500).json({ error: "Internal server error" });
      } else {
        return res.status(parseInt(e.status)).json({ error: e.error });
      }
    }

    try {
      console.log(education);
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
        // let createdEducation = await educationData.createEducation(createdResume._id,education[i].school, education[i].address, education[i].degree, education[i].gpa, education[i].startYear, education[i].endYear);
        // console.log(createdEducation);
      }
    } catch (e) {
      if (typeof e !== "object" || !("status" in e)) {
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

        for (let j = 0; j < experience[i].bulletPoints.length; j++) {
          experience[i].bulletPoints[j] =
            helper.resumeHelper.checkifproperbullet(
              experience[i].bulletPoints[j]
            );
        }
      }
    } catch (e) {
      console.log(e);
      if (typeof e !== "object" || !("status" in e)) {
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
      }
    } catch (e) {
      console.log(e);
      if (typeof e !== "object" || !("status" in e)) {
        return res.status(500).json({ error: "Internal server error" });
      } else {
        return res.status(parseInt(e.status)).json({ error: e.error });
      }
    }
    let personalDetails = {
      name: resumeData.name,
      address: resumeData.address,
      email: resumeData.email,
      contact: resumeData.contact,
      linkedin: resumeData.linkedin,
    };

    let resumeObj = {
      personalDetails: JSON.stringify(personalDetails),
      education: JSON.stringify(education),
      experience: JSON.stringify(experience),
      projects: JSON.stringify(projects),
      skills: JSON.stringify(skills),
    };

    try {
      let pdf = await pdfCreateResume.createResumePdf(resumeObj);
      console.log("here routes - ");
      streamToBuffer(pdf, (err, buffer) => {
        if (err) {
          throw { status: 500, error: "Error generating the pdf" };
        } else {
          res.set("Content-Type", "application/pdf");
          res.set("Content-Disposition", 'attachment; filename="resume.pdf"');
          return res.send(buffer);
        }
      });
    } catch (e) {
      console.log(e);
      if (typeof e !== "object" || !("status" in e)) {
        return res.status(500).json({ error: "Internal server error" });
      } else {
        return res.status(parseInt(e.status)).json({ error: e.error });
      }
    }
  });

module.exports = router;
