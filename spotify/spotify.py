import os
import tkinter as tk
from tkinter import filedialog, messagebox
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from yt_dlp import YoutubeDL

# ===== CONFIGURAÇÕES SPOTIFY (Preencha com suas credenciais) =====
# No seu arquivo spotify.py:

CLIENT_ID = "a0d73991c85343489615b84caffd0a03"
CLIENT_SECRET = "COLE_AQUI_O_SEU_CLIENT_SECRET" # Cole o que você acabou de copiar
REDIRECT_URI = "http://127.0.0.1:8888/callback"

class AppDownloader:
    def __init__(self, root):
        self.root = root
        self.root.title("Spotify Test Suite - Metadata to MP3")
        self.root.geometry("500x300")

        # Autenticação Spotify
        self.sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            redirect_uri=REDIRECT_URI,
            scope="playlist-read-private"
        ))

        # UI Elements
        tk.Label(root, text="Link da Playlist Spotify:", font=('Arial', 10, 'bold')).pack(pady=5)
        self.entry_url = tk.Entry(root, width=60)
        self.entry_url.pack(pady=5)

        self.btn_folder = tk.Button(root, text="Selecionar Pasta de Destino", command=self.escolher_pasta)
        self.btn_folder.pack(pady=10)
        
        self.label_pasta = tk.Label(root, text="Nenhuma pasta selecionada", fg="blue")
        self.label_pasta.pack()

        self.btn_download = tk.Button(root, text="🚀 BAIXAR TODAS", bg="green", fg="white", 
                                      command=self.processar_download, font=('Arial', 10, 'bold'))
        self.btn_download.pack(pady=20)

        self.pasta_destino = ""

    def escolher_pasta(self):
        self.pasta_destino = filedialog.askdirectory()
        if self.pasta_destino:
            self.label_pasta.config(text=f"Destino: {self.pasta_destino}")

    def extrair_dados_spotify(self, url):
        playlist_id = url.split("/")[-1].split("?")[0]
        results = self.sp.playlist_items(playlist_id)
        tracks = results['items']
        
        while results['next']:
            results = self.sp.next(results)
            tracks.extend(results['items'])

        # Criar subpasta com o nome da playlist (opcional, para organização)
        playlist_info = self.sp.playlist(playlist_id)
        nome_playlist = playlist_info['name'].replace("/", "-") # Limpar caracteres inválidos
        path_final = os.path.join(self.pasta_destino, nome_playlist)
        os.makedirs(path_final, exist_ok=True)
        
        return tracks, path_final

    def baixar_via_yt(self, track_item, pasta_final):
        track = track_item['track']
        if not track: return
        
        nome = track['name']
        artista = track['artists'][0]['name']
        query = f"{artista} {nome} official audio"
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f"{pasta_final}/%(title)s.%(ext)s",
            'quiet': True,
            'default_search': 'ytsearch1',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }

        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([query])

    def processar_download(self):
        url = self.entry_url.get()
        if not url or not self.pasta_destino:
            messagebox.showwarning("Atenção", "Preencha a URL e selecione a pasta!")
            return

        try:
            tracks, path_final = self.extrair_dados_spotify(url)
            total = len(tracks)
            
            for i, item in enumerate(tracks):
                print(f"Baixando {i+1}/{total}...")
                self.baixar_via_yt(item, path_final)
            
            messagebox.showinfo("Sucesso", f"Download de {total} músicas concluído em:\n{path_final}")
        except Exception as e:
            messagebox.showerror("Erro", f"Falha no processo: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = AppDownloader(root)
    root.mainloop()