import Link from "next/link";
import { BookOpen, Sparkles, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-12 h-12 text-purple-300" />
            <h1 className="text-5xl font-bold text-white">Bookist</h1>
          </div>
          <p className="text-xl text-purple-200">
            Le Netflix des Romans IA Personnalisés
          </p>
        </header>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
            Créez votre saga personnalisée avec l'IA
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Choisissez votre héros, votre univers, et laissez l'IA créer des
            romans captivants tome après tome.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/subscription"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold text-lg border border-white/30 transition-all"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <Sparkles className="w-12 h-12 text-purple-300 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">
              Romans Personnalisés
            </h3>
            <p className="text-purple-100">
              Créez des histoires uniques avec vos propres personnages et
              univers. Chaque tome est généré selon vos préférences.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <Zap className="w-12 h-12 text-blue-300 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">
              Tomes Illimités
            </h3>
            <p className="text-purple-100">
              Continuez vos sagas préférées à l'infini. L'IA maintient la
              cohérence de votre histoire tome après tome.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <BookOpen className="w-12 h-12 text-indigo-300 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">
              Couvertures IA
            </h3>
            <p className="text-purple-100">
              Chaque tome dispose de sa propre couverture générée par IA dans
              le style de votre choix.
            </p>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="max-w-4xl mx-auto text-center bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20">
          <h3 className="text-3xl font-bold text-white mb-4">
            À partir de 9,99€/mois
          </h3>
          <p className="text-xl text-purple-100 mb-6">
            3 tomes par mois · Tous les genres · Illustrations incluses
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
          >
            Démarrer maintenant
          </Link>
        </div>
      </div>
    </div>
  );
}
