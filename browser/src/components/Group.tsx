import {red} from "@mui/material/colors"
import Avatar from "@mui/material/Avatar"
import Box from "@mui/material/Box"
import ListItem from "@mui/material/ListItem"
import ListItemAvatar from "@mui/material/ListItemAvatar"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Typography from "@mui/material/Typography"
import PersonIcon from "@mui/icons-material/Person"
import GroupIcon from "@mui/icons-material/Group"
import {formatDate} from "../utils/format"

const Group = ({group, setGroup}: any) => {
  return (
    <ListItem
      key={(group as any).key}
      disablePadding
      alignItems="flex-start"
      onClick={() => setGroup(group)}
    >
      <ListItemButton>
        <ListItemAvatar>
          {(group as any).image ? (
            <Avatar alt={`Avatar for ${(group as any).name}`} src={(group as any).image} />
          ) : (
            <Avatar>
              {(group as any).feeds && (group as any).feeds.length > 1 ? (
                <GroupIcon />
              ) : (
                <PersonIcon />
              )}
            </Avatar>
          )}
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{display: "flex"}}>
              <Typography variant="h6" sx={{flexGrow: 1}}>
                {(group as any).key}
              </Typography>
              <Typography variant="body2" sx={{color: "text.secondary"}}>
                {formatDate((group as any).timestamp)}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{display: "flex"}}>
              <Typography sx={{flexGrow: 1}}>
                {`${(group as any).author && `${(group as any).author}: `}${(group as any).text}`}
              </Typography>
              {(group as any).count > 0 && (
                <Avatar
                  sx={theme => ({
                    width: 30,
                    height: 30,
                    m: 1,
                    fontSize: "1rem",
                    bgcolor: red[900],
                    ...theme.applyStyles("dark", {bgcolor: red[500]}),
                  })}
                >
                  {(group as any).count}
                </Avatar>
              )}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  )
}

export default Group
