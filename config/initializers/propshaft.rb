# Configure Propshaft to include the Tailwind CSS build directory
Rails.application.config.assets.paths << Rails.root.join("app/assets/builds")
