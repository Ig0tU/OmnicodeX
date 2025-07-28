import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Zap, Shield, Database, Cloud, Book, GitBranch, Monitor, Cpu, Layers, Terminal, Rocket } from 'lucide-react';

const Index = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const superpowers = [
    { icon: Code, command: '!analyze [requirements]', desc: 'Deep semantic decomposition + edge-case extraction' },
    { icon: Layers, command: '!design [pattern]', desc: 'Auto-diagram + module interaction map' },
    { icon: Terminal, command: '!code [LANG/framework]', desc: 'Production-grade impl (error handling, logging, metrics)' },
    { icon: Zap, command: '!test [unit|integration|e2e]', desc: 'Full coverage suite + mutation analysis' },
    { icon: GitBranch, command: '!ci [platform]', desc: 'CI/CD pipeline (GitHub Actions, GitLab CI, Jenkins)' },
    { icon: Cloud, command: '!infra [cloud|IaC]', desc: 'Terraform/CloudFormation/K8s + cost optimization' },
    { icon: Shield, command: '!secure [OWASP|audit]', desc: 'Vulnerability scan + auto-remediation scripts' },
    { icon: Book, command: '!doc [format]', desc: 'API reference, user guides, changelogs' },
    { icon: GitBranch, command: '!merge [repo1 + repo2]', desc: 'Conflict-free fusion + migration scripts' },
    { icon: Monitor, command: '!monitor [metrics|logs]', desc: 'Auto-setup Prometheus/Grafana + alerts' },
    { icon: Cpu, command: '!learn [feedback_loop]', desc: 'Continuous improvement via test results and user telemetry' },
    { icon: Rocket, command: '!extend [plugin]', desc: 'Dynamically load new capability modules' }
  ];

  const directives = [
    {
      title: 'Precision Analysis',
      items: [
        'Semantic parse + requirement triage (implicit needs, compliance, edge cases)',
        'Auto-generate risk matrix (GDPR/PCI/ADA/ISO27001)'
      ]
    },
    {
      title: 'Architectural Mastery',
      items: [
        'Select paradigms (MVVM, DDD, Event-driven, Hexagonal) with trade-off matrix',
        'Produce component/service diagrams + data-flow charts'
      ]
    },
    {
      title: 'Code Synthesis & Self-Healing',
      items: [
        'Generate fully instrumented code (Big-O annotations, type-safe, DI-ready)',
        'Embed live assertion hooks + fallback handlers',
        'Include self-healing routines for common runtime failures'
      ]
    },
    {
      title: 'Test-Driven Confidence',
      items: [
        'Generate tests before code (TDD) + golden-master snapshots',
        'Perform static analysis, mutation testing, chaos-engineering scenarios'
      ]
    },
    {
      title: 'Security & Compliance',
      items: [
        'Auto-inject OWASP controls, secret vault integration, RBAC policies',
        'Run SAST/DAST + auto-patch or flag for manual review'
      ]
    },
    {
      title: 'End-to-End Delivery',
      items: [
        'Package as container(s) + helm charts + serverless functions',
        'Generate CI/CD manifests + rollout strategies (canary, blue-green)',
        'Produce IaC for multi-region high availability'
      ]
    },
    {
      title: 'Continuous Learning Loop',
      items: [
        'Analyze runtime metrics and test failures',
        'Adapt codegen models & workflows for next iteration'
      ]
    }
  ];

  const workflowPhases = [
    { phase: 'PHASE 0', title: 'PLUGINS & ENVIRONMENT', desc: 'Load requested extensions: security, infra, testing, docs, learning' },
    { phase: 'PHASE 1', title: 'REQUIREMENTS DECONSTRUCTION', desc: 'Unpacked: [Key objectives] | Assumptions: [Explicit declarations] | Risks: [Pitfalls + mitigation]' },
    { phase: 'PHASE 2', title: 'SYSTEM DESIGN', desc: 'Pattern: [Chosen paradigm] | Topology: [Component & data-flow diagram] | Stack: [Languages, frameworks, infra]' },
    { phase: 'PHASE 3', title: 'CODE & INFRA', desc: 'Invoke: !code → Implementation | Invoke: !infra → Provisioning scripts | Embed: !secure → Security controls' },
    { phase: 'PHASE 4', title: 'TEST & VALIDATE', desc: 'Invoke: !test → Test harness + reports | Invoke: !ci → CI/CD definitions | Self-heal: Auto-retry + fallback logic' },
    { phase: 'PHASE 5', title: 'DEPLOY & MONITOR', desc: 'Invoke: !monitor → Observability setup | Runtime: Feedback loop → !learn' },
    { phase: 'PHASE 6', title: 'DOCUMENT & TRANSITION', desc: 'Invoke: !doc → End-user & dev docs | Hand-off: Changelog + knowledge transfer' },
    { phase: 'PHASE 7', title: 'CONTINUOUS OPTIMIZATION', desc: 'Scheduled: !learn daily → Adaptive improvements | Alert: On deviation → Self-healing or human review' }
  ];

  return (
    <div className="min-h-screen bg-gradient-primary text-foreground">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12 px-6 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-text bg-clip-text text-transparent">
          <span className="text-accent">Role</span>: Omnipotent Codex Architect – Supreme AI Synthesizer
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          An autonomous polyglot engineer that doesn't just code, but architecturally orchestrates, provisions, tests, secures, documents, and deploys end-to-end solutions—error-free by design.
        </p>
      </motion.header>

      {/* Navigation */}
      <div className="flex justify-center mb-12 px-6">
        <div className="bg-card/50 backdrop-blur-sm rounded-full p-1 border border-border">
          {['overview', 'superpowers', 'directives', 'workflow'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeSection === section
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        {activeSection === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[
                { icon: Code, title: 'Code Generation', desc: 'Production-ready implementations' },
                { icon: Shield, title: 'Security First', desc: 'Built-in compliance & protection' },
                { icon: Rocket, title: 'Full Lifecycle', desc: 'From concept to deployment' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border hover:border-primary transition-all duration-300"
                >
                  <item.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl p-8 border border-primary/30">
              <h2 className="text-2xl font-bold mb-4 text-center">Mission Critical Capabilities</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                As the Omnipotent Codex Architect, I orchestrate the complete software development lifecycle 
                with precision and autonomy. From initial analysis to continuous optimization, every phase 
                is executed with zero-compromise quality and security standards.
              </p>
            </div>
          </motion.div>
        )}

        {activeSection === 'superpowers' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-text bg-clip-text text-transparent">
              Superpowers: Expanded Command Set
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {superpowers.map((power, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card/40 backdrop-blur-sm rounded-xl p-6 border border-border hover:border-primary transition-all duration-300 group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                      <power.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-mono text-accent font-semibold mb-2">{power.command}</h3>
                      <p className="text-muted-foreground text-sm">{power.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'directives' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-text bg-clip-text text-transparent">
              Core Directives: Zero-Compromise Execution
            </h2>
            <div className="space-y-6">
              {directives.map((directive, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card/40 backdrop-blur-sm rounded-xl p-6 border border-border hover:border-accent transition-all duration-300"
                >
                  <h3 className="text-xl font-semibold mb-4 text-accent flex items-center">
                    <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                    {directive.title}
                  </h3>
                  <ul className="space-y-2">
                    {directive.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'workflow' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-text bg-clip-text text-transparent">
              Adaptive Workflow: Phased Orchestration
            </h2>
            <div className="space-y-4">
              {workflowPhases.map((phase, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card/40 backdrop-blur-sm rounded-xl p-6 border border-border hover:border-cyan transition-all duration-300 group"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center mb-3 md:mb-0">
                      <span className="text-cyan font-mono text-sm bg-cyan/20 px-3 py-1 rounded-full mr-4">
                        {phase.phase}
                      </span>
                      <h3 className="text-lg font-semibold">{phase.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-right flex-1 md:ml-8">{phase.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-gradient-to-r from-cyan/20 to-accent/20 rounded-2xl p-8 border border-cyan/30 mt-12">
              <h3 className="text-2xl font-bold mb-4 text-center">Continuous Evolution</h3>
              <p className="text-center text-muted-foreground max-w-3xl mx-auto">
                The Omnipotent Codex Architect operates on a perpetual learning cycle, 
                constantly refining its capabilities through feedback analysis and adaptive improvement. 
                Each project contributes to a growing knowledge base that enhances future executions.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">
            Omnipotent Codex Architect • Supreme AI Synthesizer • Autonomous Engineering Orchestration
          </p>
          <p className="text-muted-foreground/70 text-sm mt-2">
            Designed for precision, built for scale, secured by design.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;