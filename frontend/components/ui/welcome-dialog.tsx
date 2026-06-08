"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const ME_QUERY = gql`
  query GetMeForWelcome {
    me {
      id
      showWelcome
    }
  }
`;

const DISMISS_WELCOME = gql`
  mutation DismissWelcome {
    dismissWelcome {
      id
      showWelcome
    }
  }
`;

export function WelcomeDialog() {
  const { data, loading } = useQuery(ME_QUERY);
  const [dismissWelcome] = useMutation(DISMISS_WELCOME, {
    refetchQueries: [{ query: ME_QUERY }],
  });

  const handleClose = async () => {
    await dismissWelcome();
  };

  if (loading) return null;

  const isOpen = data?.me?.showWelcome ?? false;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-300" />
             <DialogTitle className="text-xl text-white">Bienvenido a Capital Fourge</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-7 text-slate-300 pt-2">
            En Capital Fourge queremos que aprendas o mejores tus conocimientos en inversión y los puedas demostrar con nuestro ranking de estrategias.
            <br /><br />
            En esta aplicación podrás recargar dinero de papel sin límites para crear portafolios según tu gusto, con distintos riesgos (agresivo o conservador) o enfoques (tecnológico, energético, inmobiliario, etc).
            <br /><br />
            Para comenzar, recarga tu cuenta y crea tu primer portafolio. Después ve a Mercado y agrega los activos que quieras.
            <br /><br />
            Esperamos ser de mucha utilidad para ti y que aprendas mucho. Cualquier comentario para mejorar lo agradeceríamos mucho.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            onClick={handleClose}
            className="h-11 rounded-full bg-emerald-300 px-6 text-slate-950 hover:bg-emerald-200"
          >
            Entendido, empecemos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
