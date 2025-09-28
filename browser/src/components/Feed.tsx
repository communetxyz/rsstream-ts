import parse from "html-react-parser"
import Avatar from "@mui/material/Avatar"
import IconButton from "@mui/material/IconButton"
import ListItem from "@mui/material/ListItem"
import ListItemAvatar from "@mui/material/ListItemAvatar"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import CheckIcon from "@mui/icons-material/Check"
import DeleteIcon from "@mui/icons-material/Delete"
import PersonIcon from "@mui/icons-material/Person"
import {urlAvatar} from "../utils/avatar"

const Feed = ({
  user,
  code,
  groups,
  currentGroup,
  feed,
  selected,
  selectFeed,
}: any) => {
  const deleteFeed = feed => {
    if (!feed || !(feed as any).key) return

    user
      .get("public")
      .next("feeds")
      .next((feed as any).key)
      .put({title: ""}, async err => {
        if (err) {
          console.error(err)
          return
        }

        try {
          const signedUrl = await user.SEA.sign((feed as any).key, user.is)
          const res = await fetch(
            `${window.location.origin}/remove-subscriber`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json;charset=utf-8",
              },
              body: JSON.stringify({code: code, url: signedUrl}),
            },
          )
          if (!res.ok) {
            console.error(res)
          }
        } catch (error) {
          console.error(error)
        }
      })
  }

  const updateGroupFeeds = (feeds, remove) => {
    if (!currentGroup) return

    const message = "Removing the last feed will remove the group. Continue?"
    if (feeds.length === 1 && !window.confirm(message)) return

    const data = {
      feeds: feeds.reduce((acc, f) => {
        // This function converts selected feeds to an object to store in
        // Holster. See Display useEffect which converts back to an array.
        return f ? {...acc, [f]: f !== remove} : {...acc}
      }, {}),
      count: 0,
      latest: 0,
      text: "",
      author: "",
    }
    user
      .get("public")
      .next("groups")
      .next(currentGroup)
      .put(data, err => {
        if (err) console.error(err)
      })
  }

  const showDelete = feed => {
    // showDelete has two actions, if currentGroup is set then removing a feed
    // from that group, otherwise removing the feed for the user.
    if (currentGroup) {
      const group = groups.all.find(g => g.key === currentGroup)
      if (group && (group as any).feeds.includes((feed as any).key)) {
        return (
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={() => updateGroupFeeds((group as any).feeds, (feed as any).key)}
          >
            <DeleteIcon />
          </IconButton>
        )
      }

      // Don't show a delete button if the feed is not in the current group.
      return
    }

    const count = groups.all.filter(g => g.feeds.includes((feed as any).key)).length
    if (!(feed as any).defaultGroup && count === 0) {
      return (
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => deleteFeed(feed)}
        >
          <DeleteIcon />
        </IconButton>
      )
    }
  }

  return (
    <ListItem
      key={(feed as any).key}
      disablePadding
      alignItems="flex-start"
      secondaryAction={showDelete(feed)}
    >
      <ListItemButton onClick={() => selectFeed(feed)} selected={selected}>
        <ListItemAvatar>
          {(feed as any).image ? (
            <Avatar alt={`Avatar for ${(feed as any).title}`} src={(feed as any).image} />
          ) : (feed as any).html_url ? (
            <Avatar {...urlAvatar((feed as any).html_url)} />
          ) : (
            <Avatar>
              <PersonIcon />
            </Avatar>
          )}
        </ListItemAvatar>
        <ListItemText
          primary={(feed as any).title && parse((feed as any).title)}
          secondary={(feed as any).html_url !== "" ? (feed as any).html_url : (feed as any).key}
        />
        {selected && (
          <IconButton edge="end" aria-label="check">
            <CheckIcon />
          </IconButton>
        )}
      </ListItemButton>
    </ListItem>
  )
}

export default Feed
