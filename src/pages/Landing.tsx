import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Layers, Zap, Code, Palette, Download, Sparkles,
  ArrowRight, Github, Star,
} from "lucide-react";

const features = [
  { icon: Layers, title: "Multi-Layer System", desc: "Stack and blend multiple glow layers with precise control over blur, opacity, and positioning." },
  { icon: Palette, title: "Color Intelligence", desc: "Smart color palette suggestions with complementary, analogous, and triadic harmony." },
  { icon: Code, title: "Export Anywhere", desc: "Export as raw CSS, Tailwind classes, or a self-contained React component." },
  { icon: Zap, title: "Live Preview", desc: "See changes instantly across mobile, tablet, and desktop viewports." },
  { icon: Download, title: "Presets & Templates", desc: "Built-in templates from Neon to Minimal. Save and share your own presets." },
  { icon: Sparkles, title: "Animations", desc: "Add breathe and pulse animations with customizable timing." },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="w-full border-b border-border/30 backdrop-blur-md bg-background/70 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Glow Editor</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/editor")}
              className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Open Editor
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6">
        {/* Background glow decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[160px]" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
              <Sparkles className="w-3 h-3" /> Visual CSS glow generator
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mt-4"
          >
            Design stunning{" "}
            <span className="text-primary">glow effects</span>{" "}
            visually
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
          >
            A multi-layer glow editor with real-time preview, smart color palettes,
            built-in templates, and one-click export to CSS, Tailwind, or React.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/editor")}
              className="h-12 px-8 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              Launch Editor <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/editor")}
              className="h-12 px-8 text-sm font-medium bg-secondary text-foreground rounded-xl hover:bg-accent transition-colors flex items-center gap-2 border border-border"
            >
              <Star className="w-4 h-4" /> View Templates
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Everything you need</h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">Powerful features for creating production-ready glow effects.</p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={item}
                whileHover={{ y: -4 }}
                className="glass-surface rounded-2xl p-6 hover:border-editor-border-hover transition-all group cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="glass-surface rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/3 pointer-events-none" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight relative">Ready to create?</h2>
            <p className="mt-3 text-muted-foreground text-sm relative">Start designing your glow effect in seconds. No account needed.</p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/editor")}
              className="mt-6 h-12 px-8 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors inline-flex items-center gap-2 shadow-lg shadow-primary/20 relative"
            >
              Open Editor <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <span>Glow Editor</span>
          </div>
          <span>Built with Lovable</span>
        </div>
      </footer>
    </div>
  );
}
