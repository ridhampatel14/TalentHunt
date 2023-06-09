import { useState } from "react";
import { helper } from "../helper";
import {
  Alert,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material/";

function EditProfile(props) {
  const [data, setData] = useState({
    name: props.data.name,
    profile_picture: props.data.profile_picture,
    description: props.data.description,
    type: props.data.type,
  });

  const [error, setError] = useState(undefined);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(data);
    try {
      data.name = helper.common.checkIsProperString(data.name, "Name");
      data.profile_picture = helper.common.isValidWebImage(
        data.profile_picture
      );
      data.description = helper.common.checkIsProperString(data.description);

      data.type = helper.common.checkIsProperString(
        data.type,
        "Type of company"
      );
    } catch (e) {
      setError(e.message);
      return;
    }
    props.onSubmit(data);
  };

  return (
    <div
      className="card"
      style={{
        width: "60rem",
        display: "block",
        marginLeft: "auto",
        marginRight: "auto",
        marginTop: "3rem",
      }}
    >
      {error && <Alert severity="error">{error}</Alert>}
      <div className="card-body">
        <h2 className="card-title">Edit Company Profile</h2>
        <br />
        <form onSubmit={handleSubmit} id="profile-form">
          <TextField
            label="Name"
            value={data.name || ""}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            variant="filled"
            color="secondary"
            type="text"
            fullWidth
            sx={{ mb: 3 }}
            required
          />
          <TextField
            label="Profile Picture URL"
            value={data.profile_picture || ""}
            onChange={(e) =>
              setData({ ...data, profile_picture: e.target.value })
            }
            variant="filled"
            color="secondary"
            type="url"
            fullWidth
            sx={{ mb: 3 }}
          />
          <TextField
            label="Description"
            value={data.description || ""}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            required
            variant="filled"
            color="secondary"
            type="text"
            fullWidth
            sx={{ mb: 3 }}
          />
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              variant="filled"
              value={data.type || ""}
              onChange={(e) => setData({ ...data, type: e.target.value })}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value={"IT"}>IT</MenuItem>
              <MenuItem value={"Automobile"}>Automobile</MenuItem>
              <MenuItem value={"Civil"}>Civil</MenuItem>
              <MenuItem value={"Healthcare"}>Healthcare</MenuItem>
              <MenuItem value={"Education"}>Education</MenuItem>
              <MenuItem value={"Law"}>Law</MenuItem>
            </Select>
          </FormControl>
          <br />
          <br />
          <Button variant="outlined" color="secondary" type="submit">
            Edit Profile
          </Button>
          <br />
          <br />
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
