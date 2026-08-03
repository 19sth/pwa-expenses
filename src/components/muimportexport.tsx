import { Button, IconButton, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { updatePageState } from "../redux/slicePage";
import { ContentCopy } from "@mui/icons-material";
import MuTakoz from "./mutakoz";
import { KEY_LOCALSTORAGE } from "../redux/store";
import { ROUTE_PREFIX } from "../utils/constants";

export default function MuImportExport() {
  const dispatch = useDispatch();

  const [appData, setAppData] = useState("");

  useEffect(() => {
    dispatch(
      updatePageState({
        navItems: [],
        title: "import export",
      })
    );
  }, [dispatch]);

  useEffect(() => {
    const localAppData = localStorage.getItem(KEY_LOCALSTORAGE) || "{}";
    setAppData(JSON.stringify(JSON.parse(localAppData), null, 2));
  }, []);

  return (
    <div>
      <div className="flex justify-end">
        <IconButton
          onClick={() => {
            navigator.clipboard.writeText(appData);
          }}
        >
          {" "}
          <ContentCopy />{" "}
        </IconButton>
      </div>

      <TextField
        label="App Data"
        multiline
        rows={20}
        value={appData}
        onChange={(e) => {
          setAppData(e.target.value);
        }}
        className="w-full pt-5"
      />

      <MuTakoz/>
      <Button className="w-full" variant="contained" onClick={()=>{
        localStorage.setItem(KEY_LOCALSTORAGE, appData);
        sessionStorage.clear()
        window.location.href = ROUTE_PREFIX
      }}>
        Save
      </Button>
    </div>
  );
}
