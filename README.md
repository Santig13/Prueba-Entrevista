# Getting Started

1. Install docker https://docs.docker.com/desktop/install/windows-install/
2. In db directory execute docker-compose
    
    ```bash
    cd db
    docker-compose up -d
    ```
    
3. Check if controller has started
    
    ```bash
    docker ps
    ```
    
4. If not can run directly in docker desktop

![image](https://github.com/user-attachments/assets/461bd157-eeff-44ec-83f1-2cc5d809f099)


5. Once container is running, database is running so server can start. In source directory execute the server (will start in 3000 port):
    
    ```bash
    cd src
    node server.js
    ```
    
7. For running the frontend, execute in frontend directory:
    
    ```bash
    npm run dev
    ```
