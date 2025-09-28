import {useEffect, useMemo, useState} from "react"
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"
import Holster from "@mblaney/holster/src/holster"
import {red} from "@mui/material/colors"
import {ThemeProvider, createTheme} from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import Display from "./components/Display"
import Help from "./components/Help"
import Register from "./components/Register"
import Invite from "./components/Invite"
import Login from "./components/Login"
import Settings from "./components/Settings"
import ValidateEmail from "./components/ValidateEmail"
import ResetPassword from "./components/ResetPassword"
import UpdatePassword from "./components/UpdatePassword"

// If on localhost assume Holster is directly available and use the default
// settings, otherwise assume a secure connection is required.
let peers
if (window.location.hostname !== "localhost") {
  peers = ["wss://" + window.location.hostname]
}

const holster = Holster({peers: peers, secure: true, indexedDB: true})
// This provides access to the API via the console.
;(window as any).holster = holster

const user = holster.user()
user.recall()

const params = new URLSearchParams(window.location.search)
const pages = [
  "invite",
  "register",
  "login",
  "settings",
  "help",
  "validate-email",
  "reset-password",
  "update-password",
]
const redirect = params.get("redirect")
const to = redirect ? (pages.includes(redirect) ? `/${redirect}` : "/") : ""

const App = () => {
  const [host, setHost] = useState(() => {
    return localStorage.getItem("host") || ""
  })
  const [code] = useState(() => {
    return sessionStorage.getItem("code") || ""
  })
  const [mode, setMode] = useState<"light" | "dark">(() => {
    return (sessionStorage.getItem("mode") as "light" | "dark") || "light"
  })
  const [feeds, setFeeds] = useState(new Map())
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: red[900],
          },
          secondary: {
            main: red[500],
          },
        },
        components: {
          MuiDivider: {
            styleOverrides: {
              root: {
                color: red[900],
              },
            },
          },
        },
      }),
    [mode],
  )

  useEffect(() => {
    if (!host) {
      fetch(`${window.location.origin}/host-public-key`).then((res: Response) => {
        if (res.ok) res.text().then((key: string) => setHost(key))
      })
      return
    }

    localStorage.setItem("host", host)
    if (!user.is) return

    const updateAccounts = async (accounts: any) => {
      if (!accounts) return

      // Check accounts against the users list of contacts.
      const c = await new Promise((res: any) => {
        user.get("public").next("contacts", res)
      })
      if (!c) return

      for (const [accountCode, account] of Object.entries(accounts)) {
        if (!account) continue
        const accountData = account as any

        let check = {
          pub: accountData.pub,
          username: accountData.username,
          name: accountData.name,
          ref: accountData.ref,
          host: accountData.host,
        }

        let found = false
        for (const [contactCode, contact] of Object.entries(c)) {
          if (contactCode !== accountCode) continue
          const contactData = contact as any

          found = true
          // The account we're checking hasn't changed.
          if (contactData.pub === check.pub) break

          // If the public key has changed for this contact then store their
          // new account details and re-share encrypted data with them to
          // help restore their account.
          const err = await new Promise((res: any) => {
            user
              .get("public")
              .next("contacts")
              .next(contactCode)
              .put(check, res)
          })
          if (err) console.error(err)

          const oldEpub = await new Promise((res: any) => {
            user.get(contactData.pub).get("epub").once(res)
          })
          if (!oldEpub) {
            console.error("User not found for old public key")
            break
          }

          const epub = await new Promise((res: any) => {
            user.get(check.pub).get("epub").once(res)
          })
          if (!epub) {
            console.error("User not found for new public key")
            break
          }

          const shared = await new Promise((res: any) => {
            user.get("shared").next(contactCode, res)
          })
          if (!shared) break

          const oldSecret = await holster.SEA.secret(oldEpub, user.is)
          const secret = await holster.SEA.secret(epub, user.is)
          const update: Record<string, any> = {}
          for (const [key, oldEnc] of Object.entries(shared)) {
            if (!key) continue
            const oldEncData = oldEnc as any

            const data = await holster.SEA.decrypt(oldEncData, oldSecret)
            const enc = await holster.SEA.encrypt(data, secret)
            update[key] = enc
          }
          if (Object.keys(update).length !== 0) {
            const err = await new Promise((res: any) => {
              user.get("shared").next(contactCode).put(update, res)
            })
            if (err) console.error(err)
          }
        }
        // Add the new contact if we referred them.
        if (!found && accountData.ref === code) {
          user
            .get("public")
            .next("contacts")
            .next(accountCode)
            .put(check, (err: any) => {
              if (err) console.error(err)
            })
        }
      }
    }
    user.get(host).get("accounts").on(updateAccounts, true)

    const updateFeeds = async (allFeeds: any) => {
      if (!allFeeds) return

      for (const [url, feed] of Object.entries(allFeeds)) {
        if (!url) continue
        const feedData = feed as any

        if (feedData && feedData.title !== "") {
          setFeeds(
            (f: Map<string, any>) =>
              new Map(
                f.set(url, {
                  url: feedData.html_url,
                  title: feedData.title,
                  image: feedData.image,
                }),
              ),
          )
        }
        const found = await new Promise((res: any) => {
          user.get("public").next("feeds").next(url, res)
        })
        const foundData = found as any
        if (!foundData || foundData.title === "") continue

        if (feedData && feedData.title) {
          // Feed details have been updated.
          const data = {
            title: feedData.title,
            description: feedData.description ?? "",
            html_url: feedData.html_url ?? "",
            language: feedData.language ?? "",
            image: feedData.image ?? "",
          }
          const err = await new Promise((res: any) => {
            user.get("public").next("feeds").next(url).put(data, res)
          })
          if (err) console.error(err)

          // Also set up a listener for updates to items in the feed.
          user
            .get(host)
            .get("feedItems")
            .get(url)
            .on((items: any) => {
              if (!items) return

              setFeeds(
                (f: Map<string, any>) =>
                  new Map(
                    f.set(url, {
                      url: feedData.html_url,
                      title: feedData.title,
                      image: feedData.image,
                      updated: Date.now(),
                      items: items,
                    }),
                  ),
              )
            }, true)
          continue
        }

        // Otherwise the feed was removed.
        const err = await new Promise((res: any) => {
          user.get("public").next("feeds").next(url).put({title: ""}, res)
        })
        if (err) {
          console.error(err)
          continue
        }

        // Request to lower subscribed count when a feed is removed.
        try {
          const signedUrl = await holster.SEA.sign(url, user.is)
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
      }
    }
    // Listen for feed changes to apply to our own feed list.
    user.get(host).get("feeds").on(updateFeeds, true)
  }, [host, code])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route
            path="/invite"
            element={
              <Invite loggedIn={user.is} mode={mode} setMode={setMode} />
            }
          />
          <Route
            path="/register"
            element={<Register user={user} mode={mode} setMode={setMode} />}
          />
          <Route
            path="/login"
            element={
              <Login user={user} host={host} mode={mode} setMode={setMode} />
            }
          />
          <Route
            path="/validate-email"
            element={
              <ValidateEmail
                loggedIn={user.is}
                mode={mode}
                setMode={setMode}
                code={params.get("code")}
                validate={params.get("validate")}
              />
            }
          />
          <Route
            path="/reset-password"
            element={
              <ResetPassword loggedIn={user.is} mode={mode} setMode={setMode} />
            }
          />
          <Route
            path="/update-password"
            element={
              <UpdatePassword
                user={user}
                loggedIn={user.is}
                current={params.get("username")}
                code={params.get("code")}
                reset={params.get("reset")}
                mode={mode}
                setMode={setMode}
              />
            }
          />
          <Route
            path="/settings"
            element={
              user.is ? (
                <Settings
                  user={user}
                  host={host}
                  code={code}
                  mode={mode}
                  setMode={setMode}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/help"
            element={<Help loggedIn={user.is} mode={mode} setMode={setMode} />}
          />
          <Route
            path="/"
            element={
              to ? (
                <Navigate to={to} />
              ) : user.is ? (
                <Display
                  user={user}
                  host={host}
                  code={code}
                  mode={mode}
                  setMode={setMode}
                  feeds={feeds}
                />
              ) : (
                <Help loggedIn={user.is} mode={mode} setMode={setMode} />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
