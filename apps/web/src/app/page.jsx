function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Video Shorts</h1>
            <div className="flex space-x-3">
              <a
                href="/home"
                className="rounded-lg bg-[#725BFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#6A57FF] transition-colors"
              >
                Browse Videos
              </a>
              <a
                href="/account/signin"
                className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                Admin Login
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Watch Amazing
            <span className="text-[#725BFF]"> Short Videos</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Discover entertaining short-form videos. Navigate through our
            curated collection of engaging content on any device.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/home"
                className="inline-flex items-center justify-center px-8 py-3 bg-[#725BFF] text-white rounded-lg hover:bg-[#6A57FF] transition-colors font-medium text-lg"
              >
                Start Watching
              </a>
              <a
                href="/shorts"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-[#725BFF] border-2 border-[#725BFF] rounded-lg hover:bg-[#725BFF] hover:text-white transition-colors font-medium text-lg"
              >
                View Shorts
              </a>
            </div>
          </div>

          {/* Device Preview */}
          <div className="mt-16 flex justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Works on All Devices
              </h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                {/* Mobile Preview */}
                <div className="text-center">
                  <div className="inline-block rounded-lg bg-black p-4 shadow-lg">
                    <div className="h-64 w-32 bg-gray-900 rounded-lg border-2 border-gray-700 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-blue-600 opacity-20"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="text-white text-xs">
                          <div className="mb-2 font-semibold">
                            Amazing Dance
                          </div>
                          <div className="flex justify-between items-center">
                            <span>❤️ 1.2K</span>
                            <span>🔗</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="h-16 w-1 bg-white rounded-full opacity-30"></div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Mobile
                  </p>
                </div>

                {/* Tablet Preview */}
                <div className="text-center">
                  <div className="inline-block rounded-lg bg-black p-3 shadow-lg">
                    <div className="h-48 w-64 bg-gray-900 rounded-lg border-2 border-gray-700 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20"></div>
                      <div className="absolute inset-4 grid grid-cols-2 gap-2">
                        <div className="bg-white bg-opacity-20 rounded"></div>
                        <div className="bg-white bg-opacity-20 rounded"></div>
                        <div className="bg-white bg-opacity-20 rounded"></div>
                        <div className="bg-white bg-opacity-20 rounded"></div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Tablet
                  </p>
                </div>

                {/* Desktop Preview */}
                <div className="text-center">
                  <div className="inline-block rounded-lg bg-black p-3 shadow-lg">
                    <div className="h-40 w-64 bg-gray-900 rounded-lg border-2 border-gray-700 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 opacity-20"></div>
                      <div className="absolute inset-4 grid grid-cols-3 gap-2">
                        <div className="bg-white bg-opacity-20 rounded"></div>
                        <div className="bg-white bg-opacity-20 rounded"></div>
                        <div className="bg-white bg-opacity-20 rounded"></div>
                        <div className="bg-white bg-opacity-20 rounded"></div>
                        <div className="bg-white bg-opacity-20 rounded"></div>
                        <div className="bg-white bg-opacity-20 rounded"></div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Desktop
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-lg bg-[#725BFF]/10 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-[#725BFF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Responsive Design
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Perfect experience on mobile, tablet, and desktop. Touch and
                mouse support.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-lg bg-[#725BFF]/10 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-[#725BFF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Save & Share
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Bookmark videos to watch later and share your favorites with
                friends
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-lg bg-[#725BFF]/10 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-[#725BFF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Smart Search
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Find videos quickly with advanced search and filtering options
              </p>
            </div>
          </div>

          {/* How to Access */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Get Started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="text-2xl mr-3">📱</span>
                  Browse Videos
                </h3>
                <p className="text-gray-600 mb-4">
                  Start watching videos right away. Works perfectly on any
                  device with responsive design and smooth performance.
                </p>
                <div className="flex space-x-3">
                  <a
                    href="/home"
                    className="inline-block bg-[#725BFF] text-white px-4 py-2 rounded-lg hover:bg-[#6A57FF] transition-colors text-sm font-medium"
                  >
                    Browse Videos
                  </a>
                  <a
                    href="/shorts"
                    className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    View Shorts
                  </a>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="text-2xl mr-3">🔧</span>
                  Admin Access
                </h3>
                <p className="text-gray-600 mb-4">
                  Content creators and administrators can manage videos with our
                  responsive admin interface.
                </p>
                <a
                  href="/admin"
                  className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Admin Panel
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
