import theme from "../utils/theme";
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Snackbar,
  SvgIconTypeMap,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  AddCircle,
  Category,
  FormatListBulleted,
  Home,
  ImportExport,
  Info,
  QuestionMark,
  Save,
} from "@mui/icons-material";
import { APP_NAME } from "../utils/constants";
import { RootState } from "../redux/store";
import { useSelector } from "react-redux";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { Link, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const iconsMap = {
  Info: Info,
  Save: Save,
  Add: AddCircle,
  List: FormatListBulleted,
  ImportExport: ImportExport,
  Home: Home,
  Category: Category,
} as Record<string, OverridableComponent<SvgIconTypeMap<{}, "svg">>>;

export interface INavItem {
  icon: string;
  link: string;
}

export interface INotifyingState {
  notificationMessage: string;
  notificationIsoDt: string;
}

export default function MuLayout() {
  const [notify, setNotify] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(
    undefined as string | undefined
  );
  const location = useLocation();
  const pageState = useSelector((state: RootState) => state.page);

  const notifications = [] as INotifyingState[];

  useEffect(() => {
    document.title = pageState.title;
  }, [pageState]);

  useEffect(() => {
    setNotify(false);
    const lNotifications = [...notifications];
    const latestNotification = lNotifications.sort((a, b) =>
      a.notificationIsoDt > b.notificationIsoDt ? 1 : -1
    )[0];
    const now = new Date();
    const notificationTimeoutMs = 5000;
    if (
      latestNotification &&
      now.getTime() - new Date(latestNotification.notificationIsoDt).getTime() <
      notificationTimeoutMs
    ) {
      setNotify(false);
      setNotificationMessage(latestNotification.notificationMessage);
      setNotify(true);
    }
  }, [notifications]);

  return (
    <ThemeProvider theme={theme}>
      <AppBar sx={{ boxShadow: 0, bgcolor: "#fff", color: "#000" }}>
        <Container maxWidth="sm">
          <Toolbar disableGutters>
            <Link className="grow" to={"./"}>
              <Typography
                className="underline decoration-4 decoration-yellow-300"
                variant="h4"
                fontWeight="bold"
              >
                {APP_NAME}.
              </Typography>
            </Link>
            <Box>
              {pageState.navItems.map((item: INavItem, ix: number) => {
                const IconClass = iconsMap[item.icon] || QuestionMark;
                return (
                  <Link key={`nav_button_${ix}`} to={item.link}>
                    <IconButton>
                      <IconClass className="text-black" />
                    </IconButton>
                  </Link>
                );
              })}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="sm" className="min-h-screen pt-20">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="in"
          variants={{
            initial: {
              opacity: 0,
            },
            in: {
              opacity: 1,
            },
            out: {
              opacity: 0,
            },
          }}
          transition={{
            type: "tween",
            ease: "linear",
            duration: 0.3,
          }}
        >
          <Outlet />
        </motion.div>
        <Snackbar
          className="mb-10"
          open={notify}
          autoHideDuration={6000}
          onClose={() => {
            setNotify(false);
          }}
          message={notificationMessage}
        />
      </Container>
    </ThemeProvider>
  );
}
