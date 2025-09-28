import {useState} from "react"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Container from "@mui/material/Container"
import FormControl from "@mui/material/FormControl"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import InputLabel from "@mui/material/InputLabel"
import OutlinedInput from "@mui/material/OutlinedInput"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import SearchAppBar from "./SearchAppBar"
import { z } from "zod"
import { useZodForm } from "../hooks/useZodForm"
import { RegisterRequestSchema } from "../../shared/schemas"

const Register = ({user, mode, setMode}: any) => {
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(user.is ? "Already logged in" : "")
  const [disabledButton, setDisabledButton] = useState(user.is)

  const form = useZodForm({
    schema: RegisterRequestSchema,
    onSubmit: async (data) => {
      setDisabledButton(true)
      setMessage("Checking invite code...")
      
      try {
        // First check the invite code
        const checkRes = await fetch(`${window.location.origin}/check-invite-code`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json;charset=utf-8",
          },
          body: JSON.stringify({code: data.code}),
        })
        
        if (!checkRes.ok) {
          const text = await checkRes.text()
          setMessage(text)
          setDisabledButton(false)
          return
        }

        // Create the user account
        user.create(data.username, data.password, (err: any) => {
          if (err) {
            console.log(err)
            setMessage("Registration failed, please try again")
            setDisabledButton(false)
            return
          }

          user.auth(data.username, data.password, async (authErr: any) => {
            if (authErr) {
              console.log(authErr)
              setMessage("Please try again or log in manually")
              setDisabledButton(false)
              return
            }

            setMessage("Account created, saving to server...")
            
            // Claim the invite code
            const claimRes = await fetch(`${window.location.origin}/claim-invite-code`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json;charset=utf-8",
              },
              body: JSON.stringify({
                code: data.code,
                pub: user.is.pub,
                epub: user.is.epub,
                username: data.username,
                email: data.email,
              }),
            })

            if (!claimRes.ok) {
              const text = await claimRes.text()
              setMessage(text)
              user.leave()
              setDisabledButton(false)
              return
            }

            sessionStorage.setItem("code", data.code)
            window.location.href = "/"
          })
        })
      } catch (error) {
        console.error(error)
        setMessage("Registration failed, please try again")
        setDisabledButton(false)
      }
    },
    initialValues: {
      code: "",
      username: "",
      password: "",
      email: "",
    }
  })

  const handleClickShowPassword = () => setShowPassword((show) => !show)

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  return (
    <>
      <SearchAppBar
        page="register"
        showGroupList={() => {}}
        createGroup={() => {}}
        editGroup={() => {}}
        createFeed={() => {}}
        mode={mode}
        setMode={setMode}
        title=""
      />
      <Container maxWidth="sm">
        <Card>
          <CardContent>
            <form onSubmit={form.handleSubmit}>
              <Grid container>
                <Grid item xs={12}>
                  <Typography
                    align="center"
                    variant="h6"
                    sx={{padding: 1}}
                    color="text.secondary"
                  >
                    Create an account
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Invite Code"
                    variant="outlined"
                    {...form.getFieldProps('code')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Username"
                    variant="outlined"
                    {...form.getFieldProps('username')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal" variant="outlined" error={!!form.errors.password}>
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <OutlinedInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...form.getFieldProps('password')}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="Password"
                    />
                    {form.errors.password && (
                      <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                        {form.errors.password}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Email"
                    variant="outlined"
                    type="email"
                    {...form.getFieldProps('email')}
                  />
                </Grid>

                {message && (
                  <Grid item xs={12}>
                    <Typography
                      align="center"
                      variant="body2"
                      sx={{padding: 2}}
                      color={message.includes("failed") || message.includes("error") ? "error" : "text.secondary"}
                    >
                      {message}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={disabledButton || form.isSubmitting}
                    sx={{margin: 2}}
                  >
                    Register
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Container>
    </>
  )
}

export default Register