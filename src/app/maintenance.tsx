export default function MaintenancePage() {
    return (
        <>
            <html lang="pl">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Plan Lekcji - Przerwa Techniczna</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body className="min-h-screen font-sans text-gray-800 bg-gray-50">
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="mb-8">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvu7fXk3m4Lz5iwLKJHAPKlelKnT8CjI-Bg&s"
                                alt="WSPiA Logo"
                                className="mx-auto w-32 h-32 object-contain"
                            />
                        </div>
                        <h1 className="text-4xl font-bold mb-6 text-gray-800">Przerwa Techniczna</h1>
                        
                        <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
                            <div className="text-6xl mb-6 text-gray-600">
                                
                            </div>
                            <p className="text-xl mb-4 text-gray-700">
                                Przepraszamy, ale aktualnie trwają prace techniczne nad planem zajęć.
                            </p>
                            <p className="text-lg text-gray-600">
                                Prosimy spróbować ponownie za kilka minut.
                            </p>
                        </div>
                        <div className="text-sm text-gray-500">
                            System zostanie przywrócony automatycznie po zakończeniu prac technicznych.
                        </div>
                    </div>
                </div>
            </body>
            </html>
        </>
    );
}
