import {useState} from "react"
import parse from "html-react-parser"
import Avatar from "@mui/material/Avatar"
import Box from "@mui/material/Box"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import PersonIcon from "@mui/icons-material/Person"
import {urlAvatar} from "../utils/avatar"
import {formatDate} from "../utils/format"

const Item = ({item, itemRefs, newFrom}: any) => {
  const [showMore, setShowMore] = useState(false)
  const stripped = (item as any).content && (item as any).content.replace(/(<([^>]+)>)/g, "")

  return (
    <Grid
      item
      xs={12}
      ref={node => {
        if (node) {
          itemRefs.current.set((item as any).key, node)
        } else {
          itemRefs.current.delete((item as any).key)
        }
      }}
    >
      {(item as any).key === newFrom && <Divider textAlign="right">New</Divider>}
      <Box sx={{pt: 2}}>
        <Box sx={{display: "flex"}}>
          {(item as any).feedImage ? (
            <Avatar alt={`Avatar for ${(item as any).feedTitle}`} src={(item as any).feedImage} />
          ) : (item as any).feedUrl ? (
            <Avatar {...urlAvatar((item as any).feedUrl)} />
          ) : (
            <Avatar>
              <PersonIcon />
            </Avatar>
          )}
          <Typography
            variant="h6"
            sx={{
              ml: 2,
              flexGrow: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {(item as any).author ? (item as any).author : (item as any).feedTitle}
          </Typography>
          <Link
            href={(item as any).permalink}
            target="_blank"
            variant="body2"
            sx={{mt: 1, whiteSpace: "nowrap"}}
          >
            {formatDate((item as any).timestamp)}
          </Link>
        </Box>
        {(item as any).title && (
          <Typography>
            <b>{parse((item as any).title)}</b>
          </Typography>
        )}
        {(item as any).content && stripped.length > 1200 && showMore && (
          <Typography>
            {parse((item as any).content)}{" "}
            <Link
              component="button"
              onClick={() => {
                setShowMore(false)
              }}
            >
              show less
            </Link>
          </Typography>
        )}
        {(item as any).content && stripped.length > 1200 && !showMore && (
          <Typography>
            {stripped.substring(0, 800)}...{" "}
            <Link
              component="button"
              onClick={() => {
                setShowMore(true)
              }}
            >
              show more
            </Link>
          </Typography>
        )}
        {(item as any).content && stripped.length <= 1200 && (
          <Typography>{parse((item as any).content)}</Typography>
        )}
        {(item as any).enclosure &&
          (item as any).enclosure.photo &&
          (item as any).enclosure.photo.map(p => (
            <img key={p.link} src={p.link} alt={p.alt} />
          ))}
        {(item as any).enclosure &&
          (item as any).enclosure.audio &&
          (item as any).enclosure.audio.map(a =>
            a.startsWith("https") ? (
              <audio key={a} controls src={a}></audio>
            ) : (
              <Link href={a} target="_blank">
                {a}
              </Link>
            ),
          )}
        {(item as any).enclosure &&
          (item as any).enclosure.video &&
          (item as any).enclosure.video.map(v =>
            v.startsWith("https") ? (
              <video key={v} controls src={v}></video>
            ) : (
              <Link href={v} target="_blank">
                {v}
              </Link>
            ),
          )}
      </Box>
    </Grid>
  )
}

export default Item
