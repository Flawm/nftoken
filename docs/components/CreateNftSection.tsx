import { Network } from "@glow-xyz/glow-client";
import { useGlowContext } from "@glow-xyz/glow-react";
import {
  GKeypair,
  GPublicKey,
  GTransaction,
  SolanaClient,
} from "@glow-xyz/solana-client";
import { BadgeCheckIcon } from "@heroicons/react/outline";
import confetti from "canvas-confetti";
import classNames from "classnames";
import { Form, Formik } from "formik";
import { useEffect, useState } from "react";
import { NFTOKEN_ADDRESS } from "../utils/constants";
import { NFTOKEN_NFT_CREATE_IX } from "../utils/nft-borsh";
import { NETWORK_TO_RPC } from "../utils/rpc-types";
import { uploadJsonToS3 } from "../utils/upload-file";
import { SimpleDropZone } from "./forms/SimpleDropZone";
import { InteractiveWell } from "./InteractiveWell";
import { LuxSubmitButton } from "./LuxButton";
import { LuxInputField } from "./LuxInput";
import { useNetworkContext } from "./NetworkContext";

type FormData = {
  name: string;
  image: string | null;
};

export const CreateNftSection = () => {
  const { user, glowDetected } = useGlowContext();
  const [success, setSuccess] = useState(false);

  const initialValues: FormData = { name: "", image: null };

  useEffect(() => {
    if (!success) {
      return;
    }

    const end = Date.now() + 3 * 1000;

    const shootConfetti = () => {
      confetti({
        particleCount: 40,
        spread: 180,
        startVelocity: 100,
        gravity: 3,
        colors: [
          "var(--red)",
          "var(--green)",
          "var(--barney)",
          "var(--purple)",
          "var(--yellow)",
          "var(--orange)",
        ],
        angle: 270,
        origin: { y: -1, x: 0.5 },
        disableForReducedMotion: true,
      });

      if (Date.now() < end) {
        requestAnimationFrame(shootConfetti);
      }
    };

    shootConfetti();

    setTimeout(() => {
      setSuccess(false);
    }, 7_500);
  }, [success, setSuccess]);

  const { network } = useNetworkContext();

  return (
    <div className="create-nft-section">
      <InteractiveWell title="Create an NFT" minimal={success} className="my-3">
        <div className={classNames({ invisible: success })}>
          <Formik
            initialValues={initialValues}
            onSubmit={async ({ name, image }, { resetForm }) => {
              const { address: wallet } = await window.glow!.connect();

              const nft_keypair = GKeypair.generate();
              const { file_url: metadata_url } = await uploadJsonToS3({
                json: { name, image },
              });
              const recentBlockhash = await SolanaClient.getRecentBlockhash({
                rpcUrl: NETWORK_TO_RPC[network],
              });

              const transaction = GTransaction.create({
                feePayer: wallet,
                recentBlockhash,
                instructions: [
                  {
                    accounts: [
                      // NFT Creator
                      { address: wallet, signer: true, writable: true },
                      // Holder
                      { address: wallet, writable: false, signer: false },
                      {
                        address: nft_keypair.address,
                        signer: true,
                        writable: true,
                      },
                      {
                        address: GPublicKey.default.toString(),
                        writable: false,
                        signer: false,
                      },
                    ],
                    program: NFTOKEN_ADDRESS,
                    data_base64: NFTOKEN_NFT_CREATE_IX.toBuffer({
                      ix: null,
                      metadata_url,
                      collection_included: false,
                    }).toString("base64"),
                  },
                ],
                signers: [nft_keypair],
              });

              await window.glow!.signAndSendTransaction({
                transactionBase64: GTransaction.toBuffer({
                  gtransaction: transaction,
                }).toString("base64"),
                network: network ?? Network.Mainnet,
              });

              resetForm({ values: { name: "", image: null } });
              setSuccess(true);
            }}
          >
            <Form>
              <div className="mb-4">
                <LuxInputField label="NFT Name" name="name" required />
              </div>

              <SimpleDropZone<FormData> label="NFT Image" fieldName="image" />

              <div className="mt-4">
                <LuxSubmitButton label="Create NFT" rounded color="brand" />
              </div>
            </Form>
          </Formik>
        </div>

        <div
          className={classNames("success", {
            visible: success && glowDetected && user,
          })}
        >
          <div className="success-icon text-success">
            <BadgeCheckIcon />
          </div>
          <p className="font-weight-medium text-success mb-0 text-center text-lg">
            <span>Your NFT has been minted!</span>
          </p>
        </div>
      </InteractiveWell>

      <style jsx>{`
        .invisible {
          opacity: 0;
          pointer-events: none;
        }

        .success {
          position: absolute;
          inset: 0;
          top: calc(50% - 2rem);
          opacity: 0;
          pointer-events: none;
          transition: var(--transition);
        }

        .success.visible {
          opacity: 1;
        }

        .success-icon {
          margin: 0 auto;
          max-width: max-content;
        }

        .success-icon :global(svg) {
          height: 1.5rem;
          width: 1.5rem;
        }
      `}</style>
    </div>
  );
};
