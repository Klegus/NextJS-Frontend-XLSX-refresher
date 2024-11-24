export default function MaintenancePage() {
    return (
        <>
            <!DOCTYPE html>
            <html lang="pl">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Plan Lekcji - Przerwa Techniczna</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="min-h-screen font-sans text-gray-800 bg-gray-50">
                <div class="container mx-auto px-4 py-12">
                    <div class="max-w-2xl mx-auto text-center">
                        <div class="mb-8">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvu7fXk3m4Lz5iwLKJHAPKlelKnT8CjI-Bg&s"
                                alt="WSPiA Logo"
                                class="mx-auto w-32 h-32 object-contain"
                            />
                        </div>
                        <h1 class="text-4xl font-bold mb-6 text-gray-800">Przerwa Techniczna</h1>
                        
                        <div class="bg-white p-8 rounded-lg shadow-lg mb-8">
                            <div class="text-6xl mb-6 text-gray-600">
                                
                            </div>
                            <p class="text-xl mb-4 text-gray-700">
                                Przepraszamy, ale aktualnie trwają prace techniczne nad planem zajęć.
                            </p>
                            <p class="text-lg text-gray-600">
                                Prosimy spróbować ponownie za kilka minut.
                            </p>
                        </div>
                        <div class="text-sm text-gray-500">
                            System zostanie przywrócony automatycznie po zakończeniu prac technicznych.
                        </div>
                    </div>
                </div>
            </body>
            </html>
        </>
    );
}
