'use client'

import { TextField, Box, Stack, Button, createTheme, ThemeProvider } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the GreatReads assistant. How can I help you today?"
    }
  ]);

  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ]);
    setMessage('');

    const response = fetch('/api/chat/', {
      method: "POST",
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify([...messages, { role: "user", content: message }])
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });

        return reader.read().then(processText);
      });
    });
  };

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#1DB954',
      },
      secondary: {
        main: '#536DFE',
      },
      background: {
        default: '#121212',
        paper: '#1E1E1E',
      },
      text: {
        primary: '#fff',
        secondary: '#B0B0B0'
      },
    },
    typography: {
      fontFamily: '"Roboto", sans-serif',
    },
    shape: {
      borderRadius: 1,
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        width={'100vw'}
        height={'100vh'}
        display={'flex'}
        justifyContent={'center'}
        alignItems={'center'}
        bgcolor="background.default"
        color="text.primary"
      >
        <Stack
          direction="column"
          width="500px"
          height="700px"
          bgcolor="background.paper"
          boxShadow={3}
          borderRadius={3}
          p={3}
          spacing={3}
        >
          <Stack
            direction="column"
            spacing={2}
            flexGrow={1}
            overflow="auto"
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={message.role === "assistant" ? 'flex-start' : 'flex-end'}
              >
                <Box
                  px={2}
                  py={1}
                  borderRadius={20}
                  bgcolor={message.role === "assistant" ? 'primary.main' : 'secondary.main'}
                  color="text.primary"
                  maxWidth="80%"
                  boxShadow={1}
                >
                  {message.content}
                </Box>
              </Box>
            ))}
          </Stack>
          <Stack
            direction="row"
            spacing={2}
          >
            <TextField
              label="Message"
              variant="outlined"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              InputProps={{
                style: { color: '#fff' },
              }}
              InputLabelProps={{
                style: { color: '#B0B0B0' },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={sendMessage}
              sx={{ borderRadius: '20px', minWidth: '100px' }}
            >
              Send
            </Button>
          </Stack>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
